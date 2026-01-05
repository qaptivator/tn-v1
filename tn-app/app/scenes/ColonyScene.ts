import Phaser from 'phaser'
import { seed, simplex2 } from './noise'
import { BaseScene } from './BaseScene'
import {
	useEcsStore,
	type Entity,
	type EntityComponentRegistry,
	type PrefabComponentRegistry,
} from '~/store/ecs'
import { useGameStore } from '~/store/game'
import { useUiStore } from '~/store/ui'

interface ColonySceneState {
	store: ReturnType<typeof useEcsStore>
}

interface IsometricTile {
	q: number
	r: number
	centerX: number
	centerY: number
	centerZ?: number
}

interface Building {
	id: string
	q: number
	r: number
	sprite: Phaser.GameObjects.Image
}

const TILE_WIDTH = 64
const TILE_HEIGHT = 32
const TILE_THICKNESS = 12

const COLORS = {
	grass: { top: 0x7ebd73, side: 0x5a8f52 },
	sand: { top: 0xf2d675, side: 0xcfb253 },
	rock: { top: 0x9daebd, side: 0x6e7d8a },
	highlight: 0xffffff,
	selected: 0xff6b6b,
}

const SHOW_BORDER = true
const RANDOM_DEPTH = false
const PERLIN_SIZE = 10
const PERLIN_SCALE = 20

class MainScene extends Phaser.Scene {
	private tiles: IsometricTile[] = []
	private terrainLayer!: Phaser.GameObjects.Container
	private objectsContainer!: Phaser.GameObjects.Container
	private cursorGraphics!: Phaser.GameObjects.Graphics
	private buildingPreviewGraphics!: Phaser.GameObjects.Graphics

	hoveredPos!: { q: number; r: number } | null
	state!: ColonySceneState

	constructor() {
		super({ key: 'MainScene' })
	}

	preload() {
		const loc = window.location.origin
		this.load.image('default', `${loc}/textures/colony/error.png`)
		this.load.image('factory', `${loc}/textures/colony/factory.png`)
		this.load.image('quarry', `${loc}/textures/colony/quarry.png`)
		this.load.image('house', `${loc}/textures/colony/house.png`)
	}

	create() {
		seed(Math.random() * 10000)

		const gameStore = useGameStore()
		const uiStore = useUiStore()

		// Setup
		this.setupCamera()
		this.terrainLayer = this.add.container(0, 0)
		this.objectsContainer = this.add.container(0, 0)
		this.generateTileGrid(24, 24)
		this.renderTerrain()
		this.cursorGraphics = this.add.graphics({ x: 0, y: 0 })
		this.buildingPreviewGraphics = this.add.graphics({ x: 0, y: 0 })

		// Input
		this.input.on('pointermove', this.handlePointerMove, this)
		this.input.on('pointerdown', this.handlePointerDown, this)

		// Listen to game store events
		gameStore.on('building:start', (draft) => {
			this.showBuildingPreview(draft)
		})

		gameStore.on('building:preview', () => {
			this.updateBuildingPreview(
				gameStore.game.buildingDraft,
				gameStore.game.draftPosition
			)
		})

		gameStore.on('building:placed', () => {
			this.hideBuildingPreview()
			this.syncFromStore()
		})

		gameStore.on('building:cancelled', () => {
			this.hideBuildingPreview()
		})

		gameStore.on('entity:selected', (entityId) => {
			this.highlightEntity(entityId)
		})

		gameStore.on('entity:deselected', () => {
			this.clearHighlight()
		})

		gameStore.on('entity:deleted', () => {
			this.syncFromStore()
		})

		// Initial sync
		this.syncFromStore()

		// Emit scene ready
		gameStore.emit('scene:ready')
	}

	private setupCamera() {
		const cam = this.cameras.main
		cam.centerOn(0, 0)
		cam.setZoom(1.2)

		this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
			if (!p.isDown) return
			cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom
			cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom
		})

		this.input.on(
			'wheel',
			(pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
				const newZoom = cam.zoom - deltaY * 0.001
				cam.setZoom(Phaser.Math.Clamp(newZoom, 0.5, 3))
			}
		)
	}

	private generateTileGrid(width: number, height: number) {
		const qOffset = width / 2
		const rOffset = height / 2

		for (let q = 0; q < width; q++) {
			for (let r = 0; r < height; r++) {
				const { x, y } = this.qrToScreen(q - qOffset, r - rOffset)

				this.tiles.push({
					q: q - qOffset,
					r: r - rOffset,
					centerX: x,
					centerY: y,
					centerZ: RANDOM_DEPTH
						? simplex2(q / PERLIN_SIZE, r / PERLIN_SIZE) * PERLIN_SCALE
						: 0,
				})
			}
		}

		this.tiles.sort((a, b) => a.centerY - b.centerY)
	}

	private renderTerrain() {
		const graphics = this.make.graphics({ x: 0, y: 0 })

		this.tiles.forEach((tile) => {
			const c = COLORS.grass
			const x = tile.centerX
			const y = tile.centerY
			const depthOffset = tile.centerZ ?? 0

			// Right Face
			graphics.fillStyle(c.side, 1)
			graphics.beginPath()
			graphics.moveTo(
				x + TILE_WIDTH,
				y + TILE_HEIGHT / 2 + TILE_THICKNESS + depthOffset
			)
			graphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2 + depthOffset)
			graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT + depthOffset)
			graphics.lineTo(
				x + TILE_WIDTH / 2,
				y + TILE_HEIGHT + TILE_THICKNESS + depthOffset
			)
			graphics.closePath()
			graphics.fillPath()

			// Left Face
			graphics.fillStyle(c.side, 1)
			graphics.beginPath()
			graphics.moveTo(x + TILE_WIDTH / 2, y + TILE_THICKNESS + depthOffset)
			graphics.lineTo(
				x + TILE_WIDTH / 2,
				y + TILE_HEIGHT + TILE_THICKNESS + depthOffset
			)
			graphics.lineTo(x, y + TILE_HEIGHT / 2 + TILE_THICKNESS + depthOffset)
			graphics.lineTo(x, y + TILE_HEIGHT / 2 + depthOffset)
			graphics.closePath()
			graphics.fillPath()

			// Top Face
			graphics.fillStyle(c.top, 1)
			graphics.beginPath()
			graphics.moveTo(x + TILE_WIDTH / 2, y + depthOffset)
			graphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2 + depthOffset)
			graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT + depthOffset)
			graphics.lineTo(x, y + TILE_HEIGHT / 2 + depthOffset)
			graphics.closePath()
			graphics.fillPath()

			if (SHOW_BORDER) {
				graphics.lineStyle(1, c.side, 0.5)
				graphics.strokePath()
			}
		})

		this.terrainLayer.add(graphics)
	}

	syncFromStore() {
		const currentIds = new Set(this.objectsContainer.list.map((c) => c.name))
		const storeIds = new Set(this.state.store.entities.map((o) => o.id))

		// Add new entities
		for (const e of this.state.store.entities) {
			if (!currentIds.has(e.id)) {
				this.addObject(e)
			}
		}

		// Remove deleted entities
		for (const c of this.objectsContainer.list) {
			if (!storeIds.has(c.name)) {
				c.destroy()
			}
		}

		// Re-sort by depth
		this.objectsContainer.sort('depth')
	}

	addObject(e: Entity) {
		const visualc = this.state.store.tryGetComponent(e.prefab, 'VisualC')
		const worldc = this.state.store.tryGetComponent(e, 'WorldC')

		if (!worldc) {
			console.warn('Entity', e.id, 'is missing WorldC component')
			return
		}

		// Find position in world space (not using tiles anymore)
		const screenPos = this.qrToScreen(worldc.x, worldc.y)

		const sprite = this.add.image(
			screenPos.x + TILE_WIDTH / 2,
			screenPos.y + TILE_HEIGHT / 2,
			visualc ? visualc.texture : 'default'
		)
		sprite.name = e.id

		const desiredWidth = TILE_WIDTH * 0.8
		const scale = desiredWidth / sprite.width

		sprite.y += 14
		sprite.setScale(scale)
		sprite.setOrigin(0.5, 1.0)
		sprite.setDepth(sprite.y)
		sprite.setInteractive()

		// Click to select
		sprite.on('pointerdown', () => {
			const gameStore = useGameStore()
			gameStore.selectEntity(e.id)
		})

		this.objectsContainer.add(sprite)
	}

	private handlePointerMove(pointer: Phaser.Input.Pointer) {
		const gameStore = useGameStore()
		const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
		const { q, r } = this.screenToQr(worldPoint.x, worldPoint.y)

		gameStore.updateHoveredPos({ q, r })
		this.hoveredPos = { q, r }

		// Update cursor
		const screenPos = this.qrToScreen(q, r)
		const x = screenPos.x
		const y = screenPos.y

		this.cursorGraphics.clear()
		this.cursorGraphics.lineStyle(2, COLORS.highlight, 1)
		this.cursorGraphics.beginPath()
		this.cursorGraphics.moveTo(x + TILE_WIDTH / 2, y)
		this.cursorGraphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2)
		this.cursorGraphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT)
		this.cursorGraphics.lineTo(x, y + TILE_HEIGHT / 2)
		this.cursorGraphics.closePath()
		this.cursorGraphics.strokePath()
	}

	private handlePointerDown(pointer: Phaser.Input.Pointer) {
		const gameStore = useGameStore()

		if (!gameStore.isPlacingBuilding || !gameStore.hoveredPos) return

		const pos = gameStore.hoveredPos
		gameStore.updatePlacementPosition(pos)
		gameStore.confirmPlacement()
	}

	private showBuildingPreview(draft: any) {
		// Placeholder for preview graphics
	}

	private updateBuildingPreview(draft: any, pos: any) {
		if (!draft || !pos) return

		const screenPos = this.qrToScreen(pos.q, pos.r)
		const x = screenPos.x + TILE_WIDTH / 2
		const y = screenPos.y + TILE_HEIGHT / 2

		this.buildingPreviewGraphics.clear()
		this.buildingPreviewGraphics.fillStyle(0x00ff00, 0.3)
		this.buildingPreviewGraphics.fillCircle(x, y, 20)
		this.buildingPreviewGraphics.lineStyle(2, 0x00ff00, 0.8)
		this.buildingPreviewGraphics.strokeCircle(x, y, 20)
	}

	private hideBuildingPreview() {
		this.buildingPreviewGraphics.clear()
	}

	private highlightEntity(entityId: string) {
		const sprite = this.objectsContainer.list.find((c) => c.name === entityId)
		if (sprite) {
			sprite.setTint(COLORS.selected)
		}
	}

	private clearHighlight() {
		this.objectsContainer.list.forEach((c) => c.clearTint())
	}

	private qrToScreen(q: number, r: number) {
		const x = (q - r) * (TILE_WIDTH / 2)
		const y = (q + r) * (TILE_HEIGHT / 2)
		return { x, y }
	}

	private screenToQr(x: number, y: number) {
		const q = (y / (TILE_HEIGHT / 2) + x / (TILE_WIDTH / 2)) / 2
		const r = (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2
		return { q: Math.round(q) - 1, r: Math.round(r) || 0 }
	}
}

export class ColonyScene extends BaseScene {
	game!: Phaser.Game
	scene!: MainScene

	constructor(parent: HTMLElement | string, state: ColonySceneState) {
		super(parent, state)
		this.scene = new MainScene()
		this.scene.state = state
		const config: Phaser.Types.Core.GameConfig = {
			type: Phaser.AUTO,
			parent: parent,
			width: window.innerWidth,
			height: window.innerHeight,
			backgroundColor: '#1a1a1a',
			scene: this.scene,
			pixelArt: true,
		}
		this.game = new Phaser.Game(config)
	}

	destroy() {
		this.game.destroy(true)
	}

	resize() {
		this.game.scale.resize(window.innerWidth, window.innerHeight)
	}
}
