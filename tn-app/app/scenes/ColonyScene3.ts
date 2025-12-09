import Phaser from 'phaser'
import { BaseScene } from './BaseScene'

interface IsometricTile {
	q: number
	r: number
	type: 'grass' | 'sand' | 'rock'
}

interface Building {
	id: string
	q: number
	r: number
	type: 'factory' | 'quarry'
	sprite: Phaser.GameObjects.Image
}

const TILE_WIDTH = 64
const TILE_HEIGHT = 64

export class IsometricColonyScene extends Phaser.Scene {
	private tiles: IsometricTile[] = []
	private buildings: Building[] = []
	private tilesGraphics!: Phaser.GameObjects.Graphics
	private buildingsContainer!: Phaser.GameObjects.Container
	state!: {}

	constructor() {
		super({ key: 'IsometricColonyScene' })
	}

	preload() {
		// Load building textures with absolute URLs
		this.load.image(
			'factory',
			`${window.location.origin}/textures/colony/factory-house.png`
		)
		this.load.image(
			'quarry',
			`${window.location.origin}/textures/colony/quarry.png`
		)
	}

	create() {
		// Generate grid tiles
		this.generateTileGrid(16, 16)

		// Create graphics for tiles
		this.tilesGraphics = this.make.graphics({ x: 0, y: 0 }) // add: true

		// Create container for buildings (rendered on top)
		this.buildingsContainer = this.add.container(0, 0)

		// Draw tiles first
		this.drawTiles()

		// Place random buildings
		this.placeRandomBuildings(20)

		// Center camera
		this.cameras.main.centerOn(this.scale.width / 2, this.scale.height / 2)
	}

	private generateTileGrid(width: number, height: number) {
		const tileTypes: Array<'grass' | 'sand' | 'rock'> = [
			'grass',
			'sand',
			'rock',
		]

		for (let q = 0; q < width; q++) {
			for (let r = 0; r < height; r++) {
				const randomType =
					tileTypes[Math.floor(Math.random() * tileTypes.length)] ?? 'grass'
				this.tiles.push({ q, r, type: randomType })
			}
		}
	}

	private qrToScreen(q: number, r: number) {
		// Isometric projection
		const x = (q - r) * (TILE_WIDTH / 2)
		const y = (q + r) * (TILE_HEIGHT / 2)
		return { x, y }
	}

	private screenToQr(x: number, y: number) {
		// Inverse isometric projection
		const q = (x / (TILE_WIDTH / 2) + y / (TILE_HEIGHT / 2)) / 2
		const r = (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2
		return { q: Math.round(q), r: Math.round(r) }
	}

	private drawTiles() {
		const graphics = this.tilesGraphics

		this.tiles.forEach((tile) => {
			const { x, y } = this.qrToScreen(tile.q, tile.r)

			// Define isometric diamond points
			const points = [
				{ x: x + TILE_WIDTH / 2, y: y }, // top
				{ x: x + TILE_WIDTH, y: y + TILE_HEIGHT / 2 }, // right
				{ x: x + TILE_WIDTH / 2, y: y + TILE_HEIGHT }, // bottom
				{ x: x, y: y + TILE_HEIGHT / 2 }, // left
			]

			// Fill tile based on type
			switch (tile.type) {
				case 'grass':
					graphics.fillStyle(0x2ecc71, 1) // Green
					break
				case 'sand':
					graphics.fillStyle(0xf1c40f, 1) // Yellow
					break
				case 'rock':
					graphics.fillStyle(0x95a5a6, 1) // Gray
					break
			}

			// Draw filled diamond
			graphics.beginPath()
			if (points[0] && points[1] && points[2] && points[3]) {
				graphics.moveTo(points[0].x, points[0].y)
				graphics.lineTo(points[1].x, points[1].y)
				graphics.lineTo(points[2].x, points[2].y)
				graphics.lineTo(points[3].x, points[3].y)
			}
			graphics.closePath()
			graphics.fillPath()

			// Draw outline
			//graphics.strokeStyle(0x000000, 1)
			graphics.strokePath()
		})
	}

	private placeRandomBuildings(count: number) {
		const buildingTypes: Array<'factory' | 'quarry'> = ['factory', 'quarry']

		for (let i = 0; i < count; i++) {
			const randomQ = Math.floor(Math.random() * 16)
			const randomR = Math.floor(Math.random() * 16)
			const randomType =
				buildingTypes[Math.floor(Math.random() * 2)] || 'factory'

			// Check if tile exists
			const tileExists = this.tiles.some(
				(tile) => tile.q === randomQ && tile.r === randomR
			)
			if (!tileExists) continue

			const { x, y } = this.qrToScreen(randomQ, randomR)

			// Create building sprite
			const sprite = this.add.image(
				x + TILE_WIDTH / 2,
				y + TILE_HEIGHT / 2,
				randomType
			)
			sprite.setOrigin(0.5, 1) // Anchor at bottom center for isometric depth
			sprite.setScale(0.8)

			// Store building
			this.buildings.push({
				id: `building-${i}`,
				q: randomQ,
				r: randomR,
				type: randomType,
				sprite,
			})

			// Add to container
			this.buildingsContainer.add(sprite)
		}

		// Sort buildings by depth (bottom buildings render first)
		this.buildingsContainer.sort('y')
	}
}

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
