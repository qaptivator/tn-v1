import type { useEcsStore } from '~/store/ecs'
import type { useGameStore } from '~/store/game'
import type { useUiStore } from '~/store/ui'
import type { useAssetsStore } from '~/store/assets'

export interface ColonySceneState {
	ecsStore: ReturnType<typeof useEcsStore>
	gameStore: ReturnType<typeof useGameStore>
	uiStore: ReturnType<typeof useUiStore>
	assetsStore: ReturnType<typeof useAssetsStore>
}

export interface IsometricTile {
	q: number
	r: number
	centerX: number
	centerY: number
	centerZ?: number
}

export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32
export const TILE_THICKNESS = 12
export const CURSOR_TWEEN_DURATION = 50
export const ZOOM_OUT_THRESHOLD = 0.4
export const MIN_ZOOM = 0.3
export const MAX_ZOOM = 3
export const CURSOR_TWEEN_EASE = 'Linear'

export const COLORS = {
	grass: { top: 0x7ebd73, side: 0x5a8f52 },
	sand: { top: 0xf2d675, side: 0xcfb253 },
	rock: { top: 0x9daebd, side: 0x6e7d8a },
	highlight: 0xffffff,
	selected: 0xff6b6b,
	movementValid: 0x00ff00,
	movementInvalid: 0xff0000,
}

export const SHOW_BORDER = true
export const RANDOM_DEPTH = false
export const PERLIN_SIZE = 10
export const PERLIN_SCALE = 20
