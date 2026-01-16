import { TILE_WIDTH, TILE_HEIGHT } from './types'

export function qrToScreen(q: number, r: number) {
	const x = (q - r) * (TILE_WIDTH / 2)
	const y = (q + r) * (TILE_HEIGHT / 2)
	return { x, y }
}

export function screenToQr(x: number, y: number, snap: boolean = true) {
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

export function getEntityScreenPos(worldc: { x: number; y: number }) {
	const screenPos = qrToScreen(worldc.x, worldc.y)
	return {
		x: screenPos.x + TILE_WIDTH / 2,
		y: screenPos.y + TILE_HEIGHT / 2 + 14,
	}
}
