import Phaser from 'phaser'
import { seed, simplex2 } from '../noise'
import {
	TILE_WIDTH,
	TILE_HEIGHT,
	TILE_THICKNESS,
	COLORS,
	SHOW_BORDER,
	RANDOM_DEPTH,
	PERLIN_SIZE,
	PERLIN_SCALE,
	type IsometricTile,
} from './types'
import { qrToScreen } from './coordinates'

export function generateTileGrid(
	width: number,
	height: number
): IsometricTile[] {
	const tiles: IsometricTile[] = []
	const qOffset = width / 2
	const rOffset = height / 2

	for (let q = 0; q < width; q++) {
		for (let r = 0; r < height; r++) {
			const { x, y } = qrToScreen(q - qOffset, r - rOffset)

			tiles.push({
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

	return tiles.sort((a, b) => a.centerY - b.centerY)
}

export function renderTerrain(
	scene: Phaser.Scene,
	tiles: IsometricTile[]
): Phaser.GameObjects.Container {
	const terrainLayer = scene.add.container(0, 0)
	const graphics = scene.make.graphics({ x: 0, y: 0 })

	tiles.forEach((tile) => {
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

	terrainLayer.add(graphics)
	return terrainLayer
}
