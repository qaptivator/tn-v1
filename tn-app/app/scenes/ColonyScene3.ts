const _buildings_test1 = [
	{
		id: 'b-0',
		q: -8,
		r: -7,
		type: 'quarry',
		sprite: {},
	},
	{
		id: 'b-1',
		q: -8,
		r: -8,
		type: 'factory',
		sprite: {},
	},
	{
		id: 'b-2', // depth -178
		q: -6,
		r: -7,
		type: 'house',
		sprite: {},
	},
	{
		id: 'b-3',
		q: -8,
		r: -4,
		type: 'factory',
		sprite: {},
	},
	{
		id: 'b-4',
		q: -7,
		r: -5,
		type: 'factory',
		sprite: {},
	},
	{
		id: 'b-5', // depth -210
		q: -7,
		r: -8,
		type: 'house',
		sprite: {},
	},
	{
		id: 'b-6',
		q: -8,
		r: -6,
		type: 'house',
		sprite: {},
	},
	{
		id: 'b-7',
		q: -8,
		r: -3,
		type: 'house',
		sprite: {},
	},
	{
		id: 'b-8',
		q: -6,
		r: -8,
		type: 'factory',
		sprite: {},
	},
	{
		id: 'b-9',
		q: -5,
		r: -8,
		type: 'quarry',
		sprite: {},
	},
	{
		id: 'b-10',
		q: -7,
		r: -7,
		type: 'factory',
		sprite: {},
	},
	{
		id: 'b-11',
		q: -5,
		r: -7,
		type: 'house',
		sprite: {},
	},
	{
		id: 'b-12',
		q: -6,
		r: -6,
		type: 'quarry',
		sprite: {},
	},
	{
		id: 'b-13',
		q: -4,
		r: -8,
		type: 'house',
		sprite: {},
	},
	{
		id: 'b-14',
		q: -8,
		r: -5,
		type: 'quarry',
		sprite: {},
	},
]

import Phaser from 'phaser'
import { BaseScene } from './BaseScene'

// --- Interfaces ---
interface IsometricTile {
	q: number
	r: number
	type: 'grass' | 'sand' | 'rock'
	centerX: number
	centerY: number
	centerZ?: number // depth
}

interface Building {
	id: string
	q: number
	r: number
	type: 'factory' | 'quarry' | 'house'
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
		this.load.image(
			'house',
			`${window.location.origin}/textures/colony/house.png`
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
		//this.generateBuildingData(15)
		// @ts-ignore
		this.buildings = _buildings_test1
		this.renderBuildings()

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
					//! depth introduced too much problems (where if a building is behind a raised tile, it will appear over it), so we will implement it later
					//centerZ: Math.random() * 10, // depth
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
			//const depthOffset = Math.random() * 10 // depth offset
			const depthOffset = tile.centerZ ?? 0

			// Right Face (Draw Second - This face should now be visible on top of the Left Face)
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

			// Left Face (Draw First - This is the face that extends to the central vertical line)
			graphics.fillStyle(c.side, 1) // Slightly darker for shading
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

			// debug
			/*graphics.fillStyle(c.side, 1)
			graphics.fillCircle(
				x + TILE_WIDTH / 2,
				y + TILE_HEIGHT + TILE_THICKNESS,
				2
			)*/

			// Optional: Subtle outline to separate tiles
			//graphics.lineStyle(1, c.side, 0.5)
			//graphics.strokePath()
		})

		//graphics.setDepth(-1)
		this.terrainLayer.add(graphics)
	}

	private generateBuildingData(count: number) {
		const types: Array<'factory' | 'quarry'> = ['factory', 'quarry']

		// Shuffle tiles to pick random locations
		const availableTiles = [...this.tiles].sort(() => 0.5 - Math.random())

		for (let i = 0; i < count; i++) {
			if (!availableTiles[i]) break

			const tile = availableTiles[i]
			if (!tile) continue

			const type = randomElement(types)

			// Note: The sprite property is set to a placeholder (any Phaser.GameObjects.Image)
			// because the Building interface requires it, but it will be replaced in renderBuildings.
			this.buildings.push({
				id: `b-${i}`,
				q: tile.q,
				r: tile.r,
				type,
				// Temporarily assign a null/dummy sprite until rendering occurs
				sprite: {} as Phaser.GameObjects.Image,
			})
		}
	}

	private renderBuildings() {
		// Iterate over the buildings array that was populated by generateBuildingData
		this.buildings.forEach((building, i) => {
			const tile = this.tiles.find(
				(t) => t.q === building.q && t.r === building.r
			)

			if (!tile) return // Should not happen if data generation was correct

			// Calculate Y position including the (now-removed or zeroed) depth offset
			const depthOffset = tile.centerZ ?? 0
			const buildingBottomY = tile.centerY + TILE_HEIGHT / 2 + depthOffset

			const sprite = this.add.image(
				tile.centerX + TILE_WIDTH / 2,
				buildingBottomY,
				building.type
			)

			// --- Scaling and Alignment ---
			const desiredWidth = TILE_WIDTH * 0.8
			const scale = desiredWidth / sprite.width

			sprite.y += 14 // manual offset to align bases (Keep this from your original logic)
			sprite.setScale(scale)

			// Origin at bottom-center (1.0)
			sprite.setOrigin(0.5, 1.0)

			// Basic Depth Sorting (Y-sorting)
			// Use the final calculated screen Y position for correct sorting
			console.log('setting depth for building', building.id, 'at y', sprite.y)
			sprite.setDepth(sprite.y)

			// Update the building object with the actual sprite reference
			building.sprite = sprite

			this.buildingsContainer.add(sprite)
		})
		// ahh so depth in a game object is actually just metadata, and to for it to actually work you need to sort the container as well
		this.buildingsContainer.sort('depth')
	}

	private handlePointerMove(pointer: Phaser.Input.Pointer) {
		// Convert screen X/Y to World X/Y (accounting for camera)
		const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y)

		// Convert World X/Y to Grid Q/R
		const { q, r } = this.screenToQr(worldPoint.x, worldPoint.y)
		console.log('handlePointerMove q,r', q, r)

		// Find the tile at the selected Q/R
		const selectedTile = this.tiles.find((tile) => tile.q === q && tile.r === r)

		if (!selectedTile) {
			this.cursorGraphics.clear()
			return
		}

		// Snap highlight to grid with depth offset
		const { centerX: x, centerY: y, centerZ: depthOffset = 0 } = selectedTile
		this.cursorGraphics.clear()
		this.cursorGraphics.lineStyle(2, COLORS.highlight, 1) // width, color, alpha

		// Fix the draw ordering
		//const buildingBaseY = y //+ TILE_HEIGHT / 2 + 11
		//console.log('buildingBaseY', buildingBaseY)
		//this.cursorGraphics.setDepth(buildingBaseY - 1)

		// Draw diamond outline at cursor
		this.cursorGraphics.beginPath()
		this.cursorGraphics.moveTo(x + TILE_WIDTH / 2, y + depthOffset)
		this.cursorGraphics.lineTo(
			x + TILE_WIDTH,
			y + TILE_HEIGHT / 2 + depthOffset
		)
		this.cursorGraphics.lineTo(
			x + TILE_WIDTH / 2,
			y + TILE_HEIGHT + depthOffset
		)
		this.cursorGraphics.lineTo(x, y + TILE_HEIGHT / 2 + depthOffset)
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
		// this edge case of it being either 0 or -0 is so funny
		const q = (y / (TILE_HEIGHT / 2) + x / (TILE_WIDTH / 2)) / 2
		const r = (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2
		return { q: Math.round(q) - 1, r: Math.round(r) === -0 ? 0 : Math.round(r) }
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
