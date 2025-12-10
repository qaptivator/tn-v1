import Phaser from 'phaser'
import { BaseScene } from './BaseScene'

// --- Interfaces ---
interface IsometricTile {
	q: number
	r: number
	type: 'grass' | 'sand' | 'rock'
	centerX: number
	centerY: number
}

interface Building {
	id: string
	q: number
	r: number
	type: 'factory' | 'quarry'
	sprite: Phaser.GameObjects.Image
}

// --- Constants ---
const TILE_WIDTH = 64
const TILE_HEIGHT = 32 // Standard ISO ratio is 2:1 (Width:Height)
const TILE_THICKNESS = 12 // How "thick" the ground looks

// Aesthetic Palette
const COLORS = {
	grass: { top: 0x7ebd73, side: 0x5a8f52 },
	sand: { top: 0xf2d675, side: 0xcfb253 },
	rock: { top: 0x9daebd, side: 0x6e7d8a },
	highlight: 0xffffff,
}

function randomElement<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)] as T
}

export class IsometricColonyScene extends Phaser.Scene {
	private tiles: IsometricTile[] = []
	private buildings: Building[] = []

	// Graphics
	private terrainLayer!: Phaser.GameObjects.Container // Use container to hold graphics
	private buildingsContainer!: Phaser.GameObjects.Container
	private cursorGraphics!: Phaser.GameObjects.Graphics

	// Interaction
	private controls!: Phaser.Cameras.Scene2D.Camera
	state!: {}

	constructor() {
		super({ key: 'IsometricColonyScene' })
	}

	preload() {
		// Using placeholder colors if images fail, but keeping your logic
		this.load.image(
			'factory',
			`${window.location.origin}/textures/colony/factory.png`
		)
		this.load.image(
			'quarry',
			`${window.location.origin}/textures/colony/quarry.png`
		)
	}

	create() {
		// 1. Setup Camera interaction (Zoom/Pan)
		this.setupCamera()

		// 2. Create Layers
		this.terrainLayer = this.add.container(0, 0)
		this.buildingsContainer = this.add.container(0, 0)

		// 3. Generate Data
		this.generateTileGrid(16, 16)

		// 4. Render Terrain (Draws the "3D" slabs)
		this.renderTerrain()

		// 5. Render Buildings
		this.placeRandomBuildings(15)

		// 6. Setup Cursor
		this.cursorGraphics = this.add.graphics({ x: 0, y: 0 })
		this.input.on('pointermove', this.handlePointerMove, this)
	}

	// --- Core Logic ---

	private setupCamera() {
		const cam = this.cameras.main
		cam.centerOn(0, 0)
		cam.setZoom(1.2)

		// Panning
		this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
			if (!p.isDown) return
			cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom
			cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom
		})

		// Zooming
		this.input.on(
			'wheel',
			(pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
				const newZoom = cam.zoom - deltaY * 0.001
				cam.setZoom(Phaser.Math.Clamp(newZoom, 0.5, 3))
			}
		)
	}

	private generateTileGrid(width: number, height: number) {
		const tileTypes: Array<'grass' | 'sand' | 'rock'> = [
			'grass',
			'sand',
			'rock',
		]

		// Offset to center the grid around 0,0
		const qOffset = width / 2
		const rOffset = height / 2

		for (let q = 0; q < width; q++) {
			for (let r = 0; r < height; r++) {
				const { x, y } = this.qrToScreen(q - qOffset, r - rOffset)

				this.tiles.push({
					q: q - qOffset,
					r: r - rOffset,
					type: randomElement(tileTypes),
					centerX: x,
					centerY: y,
				})
			}
		}

		// Sort tiles by depth (Painter's Algorithm) so lower tiles draw in front
		this.tiles.sort((a, b) => a.centerY - b.centerY)
	}

	private renderTerrain() {
		const graphics = this.make.graphics({ x: 0, y: 0 })

		this.tiles.forEach((tile) => {
			const c = COLORS[tile.type]
			const x = tile.centerX
			const y = tile.centerY

			// 1. Draw Side Faces (The "Thickness")
			// Right Face
			graphics.fillStyle(c.side, 1)
			graphics.beginPath()
			graphics.moveTo(x + TILE_WIDTH / 2, y)
			graphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2)
			graphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2 + TILE_THICKNESS)
			graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_THICKNESS)
			graphics.closePath()
			graphics.fillPath()

			// Left Face
			graphics.fillStyle(c.side, 0.8) // Slightly darker for shading
			graphics.beginPath()
			graphics.moveTo(x + TILE_WIDTH / 2, y + TILE_THICKNESS)
			graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT + TILE_THICKNESS)
			graphics.lineTo(x, y + TILE_HEIGHT / 2 + TILE_THICKNESS)
			graphics.lineTo(x, y + TILE_HEIGHT / 2)
			graphics.closePath()
			graphics.fillPath()

			// 2. Draw Top Face
			graphics.fillStyle(c.top, 1)
			graphics.beginPath()
			graphics.moveTo(x + TILE_WIDTH / 2, y)
			graphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2)
			graphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT)
			graphics.lineTo(x, y + TILE_HEIGHT / 2)
			graphics.closePath()
			graphics.fillPath()

			// Optional: Subtle outline to separate tiles
			graphics.lineStyle(1, c.side, 0.5)
			graphics.strokePath()
		})

		this.terrainLayer.add(graphics)
	}

	private placeRandomBuildings(count: number) {
		const types: Array<'factory' | 'quarry'> = ['factory', 'quarry']

		// Shuffle tiles to pick random locations
		const availableTiles = [...this.tiles].sort(() => 0.5 - Math.random())

		for (let i = 0; i < count; i++) {
			if (!availableTiles[i]) break

			const tile = availableTiles[i]
			if (!tile) continue

			// Center sprite on tile
			const type = randomElement(types)
			const sprite = this.add.image(
				tile?.centerX + TILE_WIDTH / 2,
				tile?.centerY + TILE_HEIGHT / 2 + 11,
				type
			)

			// --- KEY FIX: Dynamic Scaling ---
			// Calculate scale to fit building within 1.5x tile width (allows some overhang)
			const desiredWidth = TILE_WIDTH * 0.8
			const scale = desiredWidth / sprite.width
			sprite.setScale(scale)

			// Origin at bottom-center + slight offset for "thickness"
			sprite.setOrigin(0.5, 0.9)

			// Basic Depth Sorting (Y-sorting)
			sprite.setDepth(tile.centerY)

			this.buildings.push({
				id: `b-${i}`,
				q: tile.q,
				r: tile.r,
				type,
				sprite,
			})

			this.buildingsContainer.add(sprite)
		}
	}

	private handlePointerMove(pointer: Phaser.Input.Pointer) {
		// Convert screen X/Y to World X/Y (accounting for camera)
		const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

		// Convert World X/Y to Grid Q/R
		const { q, r } = this.screenToQr(worldPoint.x, worldPoint.y)

		// Snap highlight to grid
		const { x, y } = this.qrToScreen(q, r)

		this.cursorGraphics.clear()
		this.cursorGraphics.lineStyle(2, COLORS.highlight, 1) // width, color, alpha

		// Draw diamond outline at cursor
		this.cursorGraphics.beginPath()
		this.cursorGraphics.moveTo(x + TILE_WIDTH / 2, y)
		this.cursorGraphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2)
		this.cursorGraphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT)
		this.cursorGraphics.lineTo(x, y + TILE_HEIGHT / 2)
		this.cursorGraphics.closePath()
		this.cursorGraphics.strokePath()
	}

	// --- Math Helpers ---

	/*	gridToScreen(x: number, y: number): { x: number; y: number } {
		const isoX = (x - y) * TILE_W
		const isoY = (x + y) * TILE_H
		return { x: isoX, y: isoY }
	}

	screenToGrid(sx: number, sy: number): { x: number; y: number } {
		const adjY = sy
		const adjX = sx
		const y = (adjY / TILE_H - adjX / TILE_W) / 2
		const x = (adjY / TILE_H + adjX / TILE_W) / 2
		return { x: Math.floor(x), y: Math.floor(y) }
	} */

	private qrToScreen(q: number, r: number) {
		const x = (q - r) * (TILE_WIDTH / 2)
		const y = (q + r) * (TILE_HEIGHT / 2)
		return { x, y }
	}

	private screenToQr(x: number, y: number) {
		// Reverse projection
		// We shift by TILE_WIDTH/2 because visual origin is usually top-left of the tile rect
		// but math origin is top-center of diamond.
		/*const normalizedX = x / (TILE_WIDTH / 2)
		const normalizedY = y / (TILE_HEIGHT / 2)

		const q = (normalizedY + normalizedX) / 2
		const r = (normalizedY - normalizedX) / 2

		return { q: Math.floor(q), r: Math.floor(r) }*/
		const q = (y / (TILE_HEIGHT / 2) + x / (TILE_WIDTH / 2)) / 2
		const r = (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2
		return { q: Math.round(q) - 1, r: Math.round(r) }
	}
}

// Wrapper Scene (Keep as is)
export class ColonyScene extends BaseScene {
	game!: Phaser.Game
	scene!: IsometricColonyScene

	constructor(parent: HTMLElement | string, state?: any) {
		super(parent, state)
		this.scene = new IsometricColonyScene()
		this.scene.state = state ?? {}
		const config: Phaser.Types.Core.GameConfig = {
			type: Phaser.AUTO,
			parent: parent,
			width: window.innerWidth,
			height: window.innerHeight,
			backgroundColor: '#1a1a1a',
			scene: this.scene,
			pixelArt: true, // Helps with crisp edges
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
