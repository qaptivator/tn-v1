import Phaser from 'phaser'
import { seed, simplex2 } from './noise'
import { BaseScene } from './BaseScene'
import type {
	Entity,
	EntityComponentRegistry,
	PrefabComponentRegistry,
	useEcsStore,
} from '~/store/ecs'
import { useGameStore } from '~/store/game'
import { useUiStore } from '~/store/ui'
import { useAssetsStore } from '~/store/assets'

interface ColonySceneState {
	ecsStore: ReturnType<typeof useEcsStore>
	gameStore: ReturnType<typeof useGameStore>
	uiStore: ReturnType<typeof useUiStore>
	assetsStore: ReturnType<typeof useAssetsStore>
}

interface IsometricTile {
	q: number
	r: number
	centerX: number
	centerY: number
	centerZ?: number
}

const TILE_WIDTH = 64
const TILE_HEIGHT = 32
const TILE_THICKNESS = 12
const CURSOR_TWEEN_DURATION = 50
const ZOOM_OUT_THRESHOLD = 0.4
const MIN_ZOOM = 0.3
const MAX_ZOOM = 3
const CURSOR_TWEEN_EASE = 'Linear'

const COLORS = {
	grass: { top: 0x7ebd73, side: 0x5a8f52 },
	sand: { top: 0xf2d675, side: 0xcfb253 },
	rock: { top: 0x9daebd, side: 0x6e7d8a },
	highlight: 0xffffff,
	selected: 0xff6b6b,
	movementValid: 0x00ff00,
	movementInvalid: 0xff0000,
}

const SHOW_BORDER = true
const RANDOM_DEPTH = false
const PERLIN_SIZE = 10
const PERLIN_SCALE = 20

class MainScene extends Phaser.Scene {
	private tiles: IsometricTile[] = []
	private terrainLayer!: Phaser.GameObjects.Container
	private objectsContainer!: Phaser.GameObjects.Container
	private movementRangeGraphics!: Phaser.GameObjects.Graphics
	private movementArrowGraphics!: Phaser.GameObjects.Graphics
	private cursorGraphics!: Phaser.GameObjects.Graphics
	private buildingPreviewSprite: Phaser.GameObjects.Image | null = null
	private movingGhostSprite: Phaser.GameObjects.Image | null = null
	private zoomWarningText: Phaser.GameObjects.Text | null = null
	private isTransitioning: boolean = false

	//! TEMPORARY
	//router!: ReturnType<typeof useRouter>

	hoveredPos!: { q: number; r: number } | undefined
	isPointerOverUI!: boolean
	state!: ColonySceneState

	constructor() {
		super({ key: 'MainScene' })
	}

	preload() {
		/*const loc = window.location.origin
        this.load.image('default', `${loc}/textures/colony/error.png`)
        this.load.image('factory', `${loc}/textures/colony/factory.png`)
        this.load.image('quarry', `${loc}/textures/colony/quarry.png`)
        this.load.image('house', `${loc}/textures/colony/house.png`)*/
		for (const asset of this.state.assetsStore.assets) {
			this.load.image(
				asset.path,
				this.state.assetsStore.getAssetUrl(asset.path).full
			)
		}
	}

	create() {
		seed(Math.random() * 10000)

		// Setup
		this.setupCamera()
		this.terrainLayer = this.add.container(0, 0)
		this.objectsContainer = this.add.container(0, 0)
		this.generateTileGrid(24, 24)
		this.renderTerrain()
		this.cursorGraphics = this.add.graphics({ x: 0, y: 0 })
		this.movementRangeGraphics = this.add.graphics({ x: 0, y: 0 })
		this.movementArrowGraphics = this.add.graphics({ x: 0, y: 0 })
		this.buildingPreviewSprite = null
		this.movingGhostSprite = null

		// Input
		this.input.on('pointermove', this.handlePointerMove, this)
		this.input.on('pointerdown', this.handlePointerDown, this)

		this.isPointerOverUI = false
		if (this.game.canvas.parentNode) {
			this.game.canvas.parentNode.addEventListener('pointerenter', () => {
				this.isPointerOverUI = false
			})
			this.game.canvas.parentNode.addEventListener('pointerleave', () => {
				this.isPointerOverUI = true
				this.cursorGraphics.clear()
			})
		}

		// Listen to game store events - Building
		this.state.gameStore.on('building:start', (draft: any) => {
			this.showBuildingPreview(draft)
		})

		this.state.gameStore.on('building:preview', () => {
			this.updateBuildingPreview(
				this.state.gameStore.buildingDraft,
				this.state.gameStore.draftPosition
			)
		})

		this.state.gameStore.on('building:placed', () => {
			this.hideBuildingPreview()
			this.syncFromStore()
		})

		this.state.gameStore.on('building:cancelled', () => {
			this.hideBuildingPreview()
		})

		// Listen to game store events - Movement
		this.state.gameStore.on('movement:start', (entityId: string) => {
			this.startMovementMode(entityId)
		})

		this.state.gameStore.on('movement:preview', () => {
			this.updateMovementPreview(
				this.state.gameStore.movingEntityId,
				this.state.gameStore.moveTargetPos
			)
		})

		this.state.gameStore.on('movement:completed', () => {
			console.log('hi')
			this.hideMovementMode()
			this.syncFromStore()
		})

		this.state.gameStore.on('movement:cancelled', () => {
			this.hideMovementMode()
		})

		// Listen to game store events - Selection
		this.state.gameStore.on('entity:selected', (entityId: string) => {
			this.highlightEntity(entityId)
		})

		this.state.gameStore.on('entity:deselected', () => {
			this.clearHighlight()
		})

		this.state.gameStore.on('entity:deleted', () => {
			this.syncFromStore()
		})

		// Initial sync
		this.syncFromStore()
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

		/*this.input.on(
			'wheel',
			(pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
				const newZoom = Phaser.Math.Clamp(
					cam.zoom - deltaY * 0.001,
					MIN_ZOOM,
					MAX_ZOOM
				)
				cam.setZoom(newZoom)
				//! TEMPORARY
				if (newZoom === MIN_ZOOM) {
					console.log('going', this.router)
					if (this.router) this.router.push('/globe')
				}
			}
		)*/
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
		const storeIds = new Set(
			this.state.ecsStore.entities.map((o: Entity) => o.id)
		)

		// Add new entities
		for (const e of this.state.ecsStore.entities) {
			if (!currentIds.has(e.id)) {
				this.addObject(e)
			}
		}

		// Remove deleted entities with animation
		for (const c of this.objectsContainer.list) {
			if (!storeIds.has(c.name)) {
				this.tweens.add({
					targets: c,
					scaleX: 0,
					scaleY: 0,
					duration: 300,
					ease: 'Back.in',
					onComplete: () => {
						c.destroy()
					},
				})
			}
		}

		//! TODO: fix this wonky code and replace it with a proper store watcher
		// Update positions for all existing entities
		for (const sprite of this.objectsContainer.list) {
			const entity = this.state.ecsStore.getEntityById(sprite.name)
			if (entity) {
				const worldc = this.state.ecsStore.tryGetComponent(entity, 'WorldC')
				if (worldc) {
					const screenPos = this.qrToScreen(worldc.x, worldc.y)
					const targetY = screenPos.y + TILE_HEIGHT / 2 + 14

					// Animate sprite to new position
					this.tweens.add({
						targets: sprite,
						x: screenPos.x + TILE_WIDTH / 2,
						y: targetY,
						duration: 300,
						ease: 'Quad.inOut',
						overwrite: 'auto',
					})
				}
			}
		}

		// Re-sort by depth
		this.objectsContainer.sort('depth')
	}

	addObject(e: Entity) {
		const visualc = this.state.ecsStore.tryGetComponent(e.prefab, 'VisualC')
		const worldc = this.state.ecsStore.tryGetComponent(e, 'WorldC')

		if (!worldc) {
			console.warn('Entity', e.id, 'is missing WorldC component')
			return
		}

		const screenPos = this.qrToScreen(worldc.x, worldc.y)
		const finalY = screenPos.y + TILE_HEIGHT / 2 + 14

		const sprite = this.add.image(
			screenPos.x + TILE_WIDTH / 2,
			finalY,
			visualc ? visualc.texture : 'default'
		)
		sprite.name = e.id

		const desiredWidth = TILE_WIDTH * 0.8
		const scale = desiredWidth / sprite.width

		sprite.setScale(0)
		sprite.setOrigin(0.5, 1.0)
		sprite.setDepth(sprite.y)

		// detect click
		sprite.setInteractive() // { useHandCursor: true }
		sprite.on('pointerdown', () => {
			this.state.gameStore.selectEntity(e.id)
		})

		this.objectsContainer.add(sprite)

		// Animate growing in
		this.tweens.add({
			targets: sprite,
			scaleX: scale,
			scaleY: scale,
			duration: 400,
			ease: 'Back.out',
		})
	}

	private shouldSnapToGrid(): boolean {
		// Check if placing building
		if (
			this.state.gameStore.mode === 'building' &&
			this.state.gameStore.buildingDraft
		) {
			const snapC = this.state.ecsStore.tryGetComponent(
				this.state.gameStore.buildingDraft.prefab,
				'WorldC'
			)
			return snapC?.snap ?? true // Default to true
		}

		// Check if moving entity
		if (
			this.state.gameStore.mode === 'moving' &&
			this.state.gameStore.movingEntityId
		) {
			const entity = this.state.ecsStore.getEntityById(
				this.state.gameStore.movingEntityId
			)
			if (entity) {
				const snapC = this.state.ecsStore.tryGetComponent(
					entity.prefab,
					'WorldC'
				)
				return snapC?.snap ?? true
			}
		}

		return true // Default snap to grid
	}

	private handlePointerMove(pointer: Phaser.Input.Pointer) {
		const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
		const { q, r } = this.screenToQr(
			worldPoint.x,
			worldPoint.y,
			this.shouldSnapToGrid()
		)

		this.state.gameStore.updateHoveredPos({ q, r })
		this.hoveredPos = { q, r }

		// Update preview based on mode
		if (this.state.gameStore.mode === 'building') {
			this.updateBuildingPreview(this.state.gameStore.buildingDraft, { q, r })
		} else if (this.state.gameStore.mode === 'moving') {
			this.updateMovementPreview(this.state.gameStore.movingEntityId, { q, r })
		}

		// Don't show cursor if over UI
		if (this.isPointerOverUI) {
			return
		}

		// Animate cursor
		const screenPos = this.qrToScreen(q, r)
		const targetX = screenPos.x
		const targetY = screenPos.y

		this.tweens.add({
			targets: this.cursorGraphics,
			x: targetX,
			y: targetY,
			duration: CURSOR_TWEEN_DURATION,
			ease: CURSOR_TWEEN_EASE,
			overwrite: 'auto',
		})

		this.cursorGraphics.clear()
		this.cursorGraphics.lineStyle(2, COLORS.highlight, 1)
		this.cursorGraphics.beginPath()
		this.cursorGraphics.moveTo(TILE_WIDTH / 2, 0)
		this.cursorGraphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
		this.cursorGraphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
		this.cursorGraphics.lineTo(0, TILE_HEIGHT / 2)
		this.cursorGraphics.closePath()
		this.cursorGraphics.strokePath()
	}

	private handlePointerDown(pointer: Phaser.Input.Pointer) {
		if (!this.state.gameStore.hoveredPos || pointer.button !== 0) return

		if (this.state.gameStore.mode === 'building') {
			const pos = this.state.gameStore.hoveredPos
			this.state.gameStore.updatePlacementPosition(pos)
			this.state.gameStore.confirmPlacement()
		} else if (this.state.gameStore.mode === 'moving') {
			const pos = this.state.gameStore.hoveredPos
			this.state.gameStore.confirmMovement(pos)
		} else {
			// Selection mode - always snap for click detection
			const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
			const { q, r } = this.screenToQr(worldPoint.x, worldPoint.y, true)

			const clickedEntity = this.state.ecsStore.entities.find((e: Entity) => {
				const worldc = this.state.ecsStore.tryGetComponent(e, 'WorldC')
				return worldc && worldc.x === q && worldc.y === r
			})

			this.clearHighlight()
			if (clickedEntity) {
				this.state.gameStore.selectEntity(clickedEntity.id)
			} else {
				// this was making objects not select on click, since they got instantly deselected
				//this.state.gameStore.deselectEntity()
			}
		}
	}

	// === BUILDING PREVIEW ===
	private showBuildingPreview(draft: any) {
		if (!draft) return
		this.updateBuildingPreview(draft, this.state.gameStore.draftPosition)
	}

	private updateBuildingPreview(draft: any, pos: any) {
		if (!draft || !pos) {
			if (this.buildingPreviewSprite) {
				this.buildingPreviewSprite.destroy()
				this.buildingPreviewSprite = null
			}
			return
		}

		const visualc = this.state.ecsStore.tryGetComponent(draft.prefab, 'VisualC')
		const screenPos = this.qrToScreen(pos.q, pos.r)
		const x = screenPos.x + TILE_WIDTH / 2
		const y = screenPos.y + TILE_HEIGHT / 2 + 14

		if (!this.buildingPreviewSprite) {
			this.buildingPreviewSprite = this.add.image(
				x,
				y,
				//@ts-ignore
				visualc ? visualc.texture : 'default'
			)

			const desiredWidth = TILE_WIDTH * 0.8
			const scale = desiredWidth / this.buildingPreviewSprite.width

			this.buildingPreviewSprite.setScale(scale)
			this.buildingPreviewSprite.setOrigin(0.5, 1.0)
			this.buildingPreviewSprite.setAlpha(0.5)
			this.buildingPreviewSprite.setTint(0x00ff00)
			this.buildingPreviewSprite.setDepth(9999)
		}

		this.tweens.add({
			targets: this.buildingPreviewSprite,
			x: x,
			y: y,
			duration: CURSOR_TWEEN_DURATION,
			ease: CURSOR_TWEEN_EASE,
			overwrite: 'auto',
		})
	}

	private hideBuildingPreview() {
		if (this.buildingPreviewSprite) {
			this.tweens.add({
				targets: this.buildingPreviewSprite,
				alpha: 0,
				duration: 200,
				ease: 'Linear',
				onComplete: () => {
					if (this.buildingPreviewSprite) {
						this.buildingPreviewSprite.destroy()
						this.buildingPreviewSprite = null
					}
				},
			})
		}
	}

	// === MOVEMENT MODE ===
	private startMovementMode(entityId: string) {
		const entity = this.state.ecsStore.getEntityById(entityId)
		if (!entity) return

		// Draw movement range diamond
		this.drawMovementRange(entity)
	}

	private drawMovementRange(entity: Entity) {
		const moveC = this.state.ecsStore.tryGetComponent(entity.prefab, 'MoveC')
		if (!moveC) return

		const worldc = this.state.ecsStore.getComponent(entity, 'WorldC')
		const distance = moveC.distance

		this.movementRangeGraphics.clear()
		this.movementRangeGraphics.lineStyle(2, COLORS.highlight, 0.5)

		// Draw diamond shape for movement range
		for (let q = -distance; q <= distance; q++) {
			for (let r = -distance; r <= distance; r++) {
				if (Math.abs(q) + Math.abs(r) <= distance) {
					const screenPos = this.qrToScreen(worldc.x + q, worldc.y + r)
					const x = screenPos.x
					const y = screenPos.y

					this.movementRangeGraphics.beginPath()
					this.movementRangeGraphics.moveTo(x + TILE_WIDTH / 2, y)
					this.movementRangeGraphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2)
					this.movementRangeGraphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT)
					this.movementRangeGraphics.lineTo(x, y + TILE_HEIGHT / 2)
					this.movementRangeGraphics.closePath()
					this.movementRangeGraphics.strokePath()
				}
			}
		}
	}

	private updateMovementPreview(entityId: string | undefined, targetPos: any) {
		if (!entityId || !targetPos) {
			this.hideMovementPreview()
			return
		}

		const entity = this.state.ecsStore.getEntityById(entityId)
		if (!entity) return

		const moveC = this.state.ecsStore.tryGetComponent(entity.prefab, 'MoveC')
		if (!moveC) return

		const worldc = this.state.ecsStore.getComponent(entity, 'WorldC')
		const visualc = this.state.ecsStore.tryGetComponent(
			entity.prefab,
			'VisualC'
		)

		// Check if move is valid (within range)
		const distance =
			Math.abs(targetPos.q - worldc.x) + Math.abs(targetPos.r - worldc.y)
		const isValid = distance <= moveC.distance

		// Create ghost sprite if needed
		if (!this.movingGhostSprite) {
			this.movingGhostSprite = this.add.image(
				0,
				0,
				visualc ? visualc.texture : 'default'
			)

			const desiredWidth = TILE_WIDTH * 0.8
			const scale = desiredWidth / this.movingGhostSprite.width
			this.movingGhostSprite.setScale(scale)
			this.movingGhostSprite.setOrigin(0.5, 1.0)
			this.movingGhostSprite.setAlpha(0.4)
			this.movingGhostSprite.setDepth(9998)
		}

		// Update ghost position and tint
		const screenPos = this.qrToScreen(targetPos.q, targetPos.r)
		const ghostX = screenPos.x + TILE_WIDTH / 2
		const ghostY = screenPos.y + TILE_HEIGHT / 2 + 14

		this.tweens.add({
			targets: this.movingGhostSprite,
			x: ghostX,
			y: ghostY,
			duration: CURSOR_TWEEN_DURATION,
			ease: CURSOR_TWEEN_EASE,
			overwrite: 'auto',
		})

		this.movingGhostSprite.setTint(
			isValid ? COLORS.movementValid : COLORS.movementInvalid
		)

		// Draw arrow from entity to target
		this.drawMovementArrow(worldc, targetPos)
	}

	private drawMovementArrow(
		from: { x: number; y: number },
		to: { q: number; r: number }
	) {
		const fromScreen = this.qrToScreen(from.x, from.y)
		const toScreen = this.qrToScreen(to.q, to.r)

		const x1 = fromScreen.x + TILE_WIDTH / 2
		const y1 = fromScreen.y + TILE_HEIGHT / 2 + 14
		const x2 = toScreen.x + TILE_WIDTH / 2
		const y2 = toScreen.y + TILE_HEIGHT / 2 + 14

		this.movementArrowGraphics.clear()
		this.movementArrowGraphics.lineStyle(2, COLORS.highlight, 0.8)

		// Draw line
		this.movementArrowGraphics.beginPath()
		this.movementArrowGraphics.moveTo(x1, y1)
		this.movementArrowGraphics.lineTo(x2, y2)
		this.movementArrowGraphics.strokePath()

		// Draw arrowhead
		const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2)
		const arrowSize = 15
		const arrowX1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6)
		const arrowY1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6)
		const arrowX2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6)
		const arrowY2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6)

		this.movementArrowGraphics.beginPath()
		this.movementArrowGraphics.moveTo(x2, y2)
		this.movementArrowGraphics.lineTo(arrowX1, arrowY1)
		this.movementArrowGraphics.moveTo(x2, y2)
		this.movementArrowGraphics.lineTo(arrowX2, arrowY2)
		this.movementArrowGraphics.strokePath()
	}

	private hideMovementPreview() {
		if (this.movingGhostSprite) {
			this.movingGhostSprite.destroy()
			this.movingGhostSprite = null
		}
		this.movementArrowGraphics.clear()
	}

	private hideMovementMode() {
		this.hideMovementPreview()
		this.movementRangeGraphics.clear()
	}

	// === SELECTION ===
	private highlightEntity(entityId: string) {
		const sprite = this.objectsContainer.list.find((c) => c.name === entityId)
		if (sprite && sprite instanceof Phaser.GameObjects.Image) {
			this.tweens.killTweensOf(sprite)
			this.tweens.add({
				targets: sprite,
				tint: COLORS.selected,
				duration: 50,
				ease: 'Linear',
			})
		}
	}

	private clearHighlight() {
		for (const c of this.objectsContainer.list) {
			if (c instanceof Phaser.GameObjects.Image) {
				this.tweens.killTweensOf(c)
				this.tweens.add({
					targets: c,
					tint: 0xffffff,
					duration: 50,
					ease: 'Linear',
				})
			}
		}
	}

	private qrToScreen(q: number, r: number) {
		const x = (q - r) * (TILE_WIDTH / 2)
		const y = (q + r) * (TILE_HEIGHT / 2)
		return { x, y }
	}

	private screenToQr(x: number, y: number, snap: boolean = true) {
		const q = (y / (TILE_HEIGHT / 2) + x / (TILE_WIDTH / 2)) / 2
		const r = (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2
		if (snap) {
			return {
				q: Math.round(q) - 1,
				r: Math.round(r) || 0,
			}
		} else {
			return {
				q: q - 1,
				r: r,
			}
		}
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
			pixelArt: false,
		}
		this.game = new Phaser.Game(config)
	}

	destroy() {
		if (this.game.canvas.parentNode) {
			this.game.canvas.parentNode.removeEventListener(
				'pointerenter',
				null as any
			)
			this.game.canvas.parentNode.removeEventListener(
				'pointerleave',
				null as any
			)
		}
		this.game.destroy(true)
	}

	resize() {
		this.game.scale.resize(window.innerWidth, window.innerHeight)
	}
}
