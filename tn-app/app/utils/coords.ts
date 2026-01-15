/**
 * Global coordinate constants
 * All coordinates are in "units" where 1 unit = 5cm
 */

export const UNIT_SIZE = 1 // 5cm per unit
export const TILE_SIZE = 100 // 5m tile = 100 units
export const CHUNK_SIZE = 10000 // 500m chunk = 10,000 units
export const WORLD_WIDTH = 801500000 // ~40,075km circumference in units
export const WORLD_HEIGHT = 801500000 // ~40,075km at poles in units

export const Coords = {
	/**
	 * Convert global XY coordinates to screen space (isometric projection)
	 * Used for rendering sprites on the Phaser canvas
	 */
	globalXYToScreen(
		globalX: number,
		globalY: number,
		tileWidth: number = 64,
		tileHeight: number = 32
	) {
		// Normalize to tile coordinates first
		const tileX = globalX / TILE_SIZE
		const tileY = globalY / TILE_SIZE

		// Isometric projection: (tile_x, tile_y) -> (screen_x, screen_y)
		const screenX = (tileX - tileY) * (tileWidth / 2)
		const screenY = (tileX + tileY) * (tileHeight / 2)

		return { x: screenX, y: screenY }
	},
	/**
	 * Convert screen space back to global XY coordinates (inverse isometric)
	 * Used for click detection and camera interaction
	 */
	screenToGlobalXY(
		screenX: number,
		screenY: number,
		tileWidth: number = 64,
		tileHeight: number = 32,
		snap: boolean = true
	) {
		// Inverse isometric projection
		const tileX = (screenY / (tileHeight / 2) + screenX / (tileWidth / 2)) / 2
		const tileY = (screenY / (tileHeight / 2) - screenX / (tileWidth / 2)) / 2

		// Convert back to global units
		let globalX = tileX * TILE_SIZE
		let globalY = tileY * TILE_SIZE

		// Snap to tile grid if requested
		if (snap) {
			globalX = Math.round(globalX / TILE_SIZE) * TILE_SIZE
			globalY = Math.round(globalY / TILE_SIZE) * TILE_SIZE
		}

		return { globalX, globalY }
	},
	/**
	 * Get chunk indices from global XY coordinates
	 */
	getChunkIndices(globalX: number, globalY: number) {
		return {
			chunkX: Math.floor(globalX / CHUNK_SIZE),
			chunkY: Math.floor(globalY / CHUNK_SIZE),
		}
	},

	/**
	 * Get local coordinates within a chunk (0 to CHUNK_SIZE)
	 */
	getLocalChunkCoordinates(globalX: number, globalY: number) {
		return {
			localX: ((globalX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
			localY: ((globalY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE,
		}
	},

	/**
	 * Convert chunk indices back to global XY (returns chunk center)
	 */
	chunkIndicesToGlobalXY(chunkX: number, chunkY: number) {
		return {
			globalX: chunkX * CHUNK_SIZE + CHUNK_SIZE / 2,
			globalY: chunkY * CHUNK_SIZE + CHUNK_SIZE / 2,
		}
	},

	/**
	 * Handle world wrapping for East-West (X-axis)
	 * Returns normalized X coordinate
	 */
	normalizeWorldX(globalX: number) {
		return ((globalX % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH
	},

	/**
	 * Calculate shortest distance between two points, accounting for world wrap
	 */
	getWorldDistance(x1: number, y1: number, x2: number, y2: number) {
		let dx = Math.abs(this.normalizeWorldX(x2) - this.normalizeWorldX(x1))
		const dy = Math.abs(y2 - y1)

		// Account for wrapping: if distance is > half world, go the other way
		if (dx > WORLD_WIDTH / 2) {
			dx = WORLD_WIDTH - dx
		}

		return Math.sqrt(dx * dx + dy * dy)
	},
}
