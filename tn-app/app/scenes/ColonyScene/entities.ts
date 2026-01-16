import Phaser from 'phaser'
import type { Entity } from '~/store/ecs'
import { type ColonySceneState, TILE_WIDTH, TILE_HEIGHT } from './types'
import { qrToScreen } from './coordinates'

export function syncFromStore(
	scene: Phaser.Scene,
	state: ColonySceneState,
	objectsContainer: Phaser.GameObjects.Container
) {
	const currentIds = new Set(objectsContainer.list.map((c) => c.name))
	const storeIds = new Set(state.ecsStore.entities.map((o: Entity) => o.id))

	/*console.log('Syncing from store')
	console.log('Current sprites:', currentIds)
	console.log('Store entities:', storeIds)
	console.log('All entities:', state.ecsStore.entities)*/

	// Add new entities
	for (const e of state.ecsStore.entities) {
		if (!currentIds.has(e.id)) {
			addObject(scene, state, objectsContainer, e)
		}
	}

	// Remove deleted entities
	for (const c of objectsContainer.list) {
		if (!storeIds.has(c.name)) {
			scene.tweens.add({
				targets: c,
				scaleX: 0,
				scaleY: 0,
				duration: 300,
				ease: 'Back.in',
				onComplete: () => c.destroy(),
			})
		}
	}

	// Update positions
	for (const sprite of objectsContainer.list) {
		const entity = state.ecsStore.getEntityById(sprite.name)
		if (entity) {
			const worldc = state.ecsStore.tryGetComponent(entity, 'WorldC')
			if (worldc) {
				const screenPos = qrToScreen(worldc.x, worldc.y)
				const targetY = screenPos.y + TILE_HEIGHT / 2 + 14

				scene.tweens.add({
					targets: sprite,
					x: screenPos.x + TILE_WIDTH / 2,
					y: targetY,
					duration: 300,
					ease: 'Quad.inOut',
					overwrite: 'auto',
				})
			}
		}
	}

	// Re-sort by depth
	objectsContainer.sort('depth')
}

export function addObject(
	scene: Phaser.Scene,
	state: ColonySceneState,
	objectsContainer: Phaser.GameObjects.Container,
	e: Entity
) {
	const visualc = state.ecsStore.tryGetComponent(e.prefab, 'VisualC')
	const worldc = state.ecsStore.tryGetComponent(e, 'WorldC')

	if (!worldc) {
		console.warn('Entity', e.id, 'is missing WorldC component')
		return
	}

	const screenPos = qrToScreen(worldc.x, worldc.y)
	const finalY = screenPos.y + TILE_HEIGHT / 2 + 14

	const sprite = scene.add.image(
		screenPos.x + TILE_WIDTH / 2,
		finalY,
		visualc ? visualc.texture : 'default'
	) as Phaser.GameObjects.Image

	sprite.name = e.id
	const desiredWidth = TILE_WIDTH * 0.8
	const scale = desiredWidth / sprite.width

	sprite.setScale(0)
	sprite.setOrigin(0.5, 1.0)
	sprite.setDepth(sprite.y)

	// Click detection
	sprite.setInteractive()
	sprite.on('pointerdown', () => {
		state.gameStore.selectEntity(e.id)
	})

	objectsContainer.add(sprite)
	/*console.log(
		'Sprite added! Container now has:',
		objectsContainer.list.length,
		'sprites'
	)*/

	// Animate in
	scene.tweens.add({
		targets: sprite,
		scaleX: scale,
		scaleY: scale,
		duration: 400,
		ease: 'Back.out',
	})
}
