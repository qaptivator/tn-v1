import Phaser from 'phaser'
import { COLORS } from './types'

export function highlightEntity(
	scene: Phaser.Scene,
	objectsContainer: Phaser.GameObjects.Container,
	entityId: string
) {
	const sprite = objectsContainer.list.find((c) => c.name === entityId)
	if (sprite && sprite instanceof Phaser.GameObjects.Image) {
		scene.tweens.killTweensOf(sprite)
		scene.tweens.add({
			targets: sprite,
			tint: COLORS.selected,
			duration: 50,
			ease: 'Linear',
		})
	}
}

export function clearHighlight(
	scene: Phaser.Scene,
	objectsContainer: Phaser.GameObjects.Container
) {
	for (const c of objectsContainer.list) {
		if (c instanceof Phaser.GameObjects.Image) {
			scene.tweens.killTweensOf(c)
			scene.tweens.add({
				targets: c,
				tint: 0xffffff,
				duration: 50,
				ease: 'Linear',
			})
		}
	}
}
