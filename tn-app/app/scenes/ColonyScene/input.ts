import Phaser from 'phaser'
import type { Entity } from '~/store/ecs'
import {
	type ColonySceneState,
	TILE_WIDTH,
	TILE_HEIGHT,
	CURSOR_TWEEN_DURATION,
	CURSOR_TWEEN_EASE,
	COLORS,
} from './types'
import { screenToQr, qrToScreen } from './coordinates'

export function setupInput(
	scene: Phaser.Scene,
	state: ColonySceneState,
	cursorGraphics: Phaser.GameObjects.Graphics,
	onPointerMove: (pos: { q: number; r: number }) => void,
	onPointerDown: (pos: { q: number; r: number }) => void,
	shouldSnapToGrid: () => boolean,
	clearHighlight: () => void,
	selectEntity: (id: string) => void
) {
	scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
		const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
		const { q, r } = screenToQr(worldPoint.x, worldPoint.y, shouldSnapToGrid())

		onPointerMove({ q, r })

		// Don't show cursor over UI
		if (!isPointerOverUI(scene)) {
			const screenPos = qrToScreen(q, r)
			scene.tweens.add({
				targets: cursorGraphics,
				x: screenPos.x,
				y: screenPos.y,
				duration: CURSOR_TWEEN_DURATION,
				ease: CURSOR_TWEEN_EASE,
				overwrite: 'auto',
			})

			drawCursor(cursorGraphics, TILE_WIDTH, TILE_HEIGHT, COLORS)
		}
	})

	scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
		if (pointer.button !== 0) return

		const worldPoint = scene.cameras.main.getWorldPoint(pointer.x, pointer.y)
		const { q, r } = screenToQr(worldPoint.x, worldPoint.y, true)

		if (
			state.gameStore.mode === 'building' ||
			state.gameStore.mode === 'moving'
		) {
			onPointerDown({ q, r })
		} else {
			// Selection mode
			const clickedEntity = state.ecsStore.entities.find((e: Entity) => {
				const worldc = state.ecsStore.tryGetComponent(e, 'WorldC')
				return worldc && worldc.x === q && worldc.y === r
			})

			clearHighlight()
			if (clickedEntity) {
				selectEntity(clickedEntity.id)
			}
		}
	})
}

export function setupUIDetection(scene: Phaser.Scene) {
	if (scene.game.canvas.parentNode) {
		const parent = scene.game.canvas.parentNode as HTMLElement
		parent.addEventListener('pointerenter', () => {
			;(scene as any).isPointerOverUI = false
		})
		parent.addEventListener('pointerleave', () => {
			;(scene as any).isPointerOverUI = true
		})
	}
}

function isPointerOverUI(scene: Phaser.Scene): boolean {
	return (scene as any).isPointerOverUI ?? false
}

function drawCursor(
	graphics: Phaser.GameObjects.Graphics,
	TILE_WIDTH: number,
	TILE_HEIGHT: number,
	COLORS: any
) {
	graphics.clear()
	graphics.lineStyle(2, COLORS.highlight, 1)
	graphics.beginPath()
	graphics.moveTo(TILE_WIDTH / 2, 0)
	graphics.lineTo(TILE_WIDTH, TILE_HEIGHT / 2)
	graphics.lineTo(TILE_WIDTH / 2, TILE_HEIGHT)
	graphics.lineTo(0, TILE_HEIGHT / 2)
	graphics.closePath()
	graphics.strokePath()
}
