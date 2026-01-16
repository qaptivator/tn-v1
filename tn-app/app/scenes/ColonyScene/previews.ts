import Phaser from 'phaser'
import type { Entity } from '~/store/ecs'
import type { ColonySceneState } from './types'
import {
	TILE_WIDTH,
	TILE_HEIGHT,
	CURSOR_TWEEN_DURATION,
	CURSOR_TWEEN_EASE,
	COLORS,
} from './types'
import { qrToScreen } from './coordinates'

export function updateBuildingPreview(
	scene: Phaser.Scene,
	state: ColonySceneState,
	draft: any,
	pos: any,
	buildingPreviewSprite: { value: Phaser.GameObjects.Image | null }
) {
	if (!draft || !pos) {
		if (buildingPreviewSprite.value) {
			buildingPreviewSprite.value.destroy()
			buildingPreviewSprite.value = null
		}
		return
	}

	const visualc = state.ecsStore.tryGetComponent(draft.prefab, 'VisualC')
	const screenPos = qrToScreen(pos.q, pos.r)
	const x = screenPos.x + TILE_WIDTH / 2
	const y = screenPos.y + TILE_HEIGHT / 2 + 14

	if (!buildingPreviewSprite.value) {
		buildingPreviewSprite.value = scene.add.image(
			x,
			y,
			//@ts-ignore
			visualc ? visualc.texture : 'default'
		)

		const desiredWidth = TILE_WIDTH * 0.8
		const scale = desiredWidth / buildingPreviewSprite.value.width

		buildingPreviewSprite.value.setScale(scale)
		buildingPreviewSprite.value.setOrigin(0.5, 1.0)
		buildingPreviewSprite.value.setAlpha(0.5)
		buildingPreviewSprite.value.setTint(0x00ff00)
		buildingPreviewSprite.value.setDepth(9999)
	}

	scene.tweens.add({
		targets: buildingPreviewSprite.value,
		x,
		y,
		duration: CURSOR_TWEEN_DURATION,
		ease: CURSOR_TWEEN_EASE,
		overwrite: 'auto',
	})
}

export function hideBuildingPreview(
	scene: Phaser.Scene,
	buildingPreviewSprite: { value: Phaser.GameObjects.Image | null }
) {
	if (buildingPreviewSprite.value) {
		scene.tweens.add({
			targets: buildingPreviewSprite.value,
			alpha: 0,
			duration: 200,
			ease: 'Linear',
			onComplete: () => {
				if (buildingPreviewSprite.value) {
					buildingPreviewSprite.value.destroy()
					buildingPreviewSprite.value = null
				}
			},
		})
	}
}

export function drawMovementRange(
	scene: Phaser.Scene,
	state: ColonySceneState,
	entity: Entity,
	movementRangeGraphics: Phaser.GameObjects.Graphics
) {
	const moveC = state.ecsStore.tryGetComponent(entity.prefab, 'MoveC')
	if (!moveC) return

	const worldc = state.ecsStore.getComponent(entity, 'WorldC')
	const distance = moveC.distance

	movementRangeGraphics.clear()
	movementRangeGraphics.lineStyle(2, COLORS.highlight, 0.5)

	for (let q = -distance; q <= distance; q++) {
		for (let r = -distance; r <= distance; r++) {
			if (Math.abs(q) + Math.abs(r) <= distance) {
				const screenPos = qrToScreen(worldc.x + q, worldc.y + r)
				const x = screenPos.x
				const y = screenPos.y

				movementRangeGraphics.beginPath()
				movementRangeGraphics.moveTo(x + TILE_WIDTH / 2, y)
				movementRangeGraphics.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2)
				movementRangeGraphics.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT)
				movementRangeGraphics.lineTo(x, y + TILE_HEIGHT / 2)
				movementRangeGraphics.closePath()
				movementRangeGraphics.strokePath()
			}
		}
	}
}

export function updateMovementPreview(
	scene: Phaser.Scene,
	state: ColonySceneState,
	entityId: string | undefined,
	targetPos: any,
	movingGhostSprite: { value: Phaser.GameObjects.Image | null },
	movementArrowGraphics: Phaser.GameObjects.Graphics
) {
	if (!entityId || !targetPos) {
		hideMovementPreview(movingGhostSprite, movementArrowGraphics)
		return
	}

	const entity = state.ecsStore.getEntityById(entityId)
	if (!entity) return

	const moveC = state.ecsStore.tryGetComponent(entity.prefab, 'MoveC')
	if (!moveC) return

	const worldc = state.ecsStore.getComponent(entity, 'WorldC')
	const visualc = state.ecsStore.tryGetComponent(entity.prefab, 'VisualC')

	const distance =
		Math.abs(targetPos.q - worldc.x) + Math.abs(targetPos.r - worldc.y)
	const isValid = distance <= moveC.distance

	if (!movingGhostSprite.value) {
		movingGhostSprite.value = scene.add.image(
			0,
			0,
			visualc ? visualc.texture : 'default'
		)
		const desiredWidth = TILE_WIDTH * 0.8
		const scale = desiredWidth / movingGhostSprite.value.width
		movingGhostSprite.value.setScale(scale)
		movingGhostSprite.value.setOrigin(0.5, 1.0)
		movingGhostSprite.value.setAlpha(0.4)
		movingGhostSprite.value.setDepth(9998)
	}

	const screenPos = qrToScreen(targetPos.q, targetPos.r)
	const ghostX = screenPos.x + TILE_WIDTH / 2
	const ghostY = screenPos.y + TILE_HEIGHT / 2 + 14

	scene.tweens.add({
		targets: movingGhostSprite.value,
		x: ghostX,
		y: ghostY,
		duration: CURSOR_TWEEN_DURATION,
		ease: CURSOR_TWEEN_EASE,
		overwrite: 'auto',
	})

	movingGhostSprite.value.setTint(
		isValid ? COLORS.movementValid : COLORS.movementInvalid
	)

	drawMovementArrow(movementArrowGraphics, worldc, targetPos)
}

export function hideMovementPreview(
	movingGhostSprite: { value: Phaser.GameObjects.Image | null },
	movementArrowGraphics: Phaser.GameObjects.Graphics
) {
	if (movingGhostSprite.value) {
		movingGhostSprite.value.destroy()
		movingGhostSprite.value = null
	}
	movementArrowGraphics.clear()
}

function drawMovementArrow(
	graphics: Phaser.GameObjects.Graphics,
	from: { x: number; y: number },
	to: { q: number; r: number }
) {
	const fromScreen = qrToScreen(from.x, from.y)
	const toScreen = qrToScreen(to.q, to.r)

	const x1 = fromScreen.x + TILE_WIDTH / 2
	const y1 = fromScreen.y + TILE_HEIGHT / 2 + 14
	const x2 = toScreen.x + TILE_WIDTH / 2
	const y2 = toScreen.y + TILE_HEIGHT / 2 + 14

	graphics.clear()
	graphics.lineStyle(2, COLORS.highlight, 0.8)

	graphics.beginPath()
	graphics.moveTo(x1, y1)
	graphics.lineTo(x2, y2)
	graphics.strokePath()

	const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2)
	const arrowSize = 15
	const arrowX1 = x2 - arrowSize * Math.cos(angle - Math.PI / 6)
	const arrowY1 = y2 - arrowSize * Math.sin(angle - Math.PI / 6)
	const arrowX2 = x2 - arrowSize * Math.cos(angle + Math.PI / 6)
	const arrowY2 = y2 - arrowSize * Math.sin(angle + Math.PI / 6)

	graphics.beginPath()
	graphics.moveTo(x2, y2)
	graphics.lineTo(arrowX1, arrowY1)
	graphics.moveTo(x2, y2)
	graphics.lineTo(arrowX2, arrowY2)
	graphics.strokePath()
}
