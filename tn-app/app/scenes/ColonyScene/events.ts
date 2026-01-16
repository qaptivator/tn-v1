import type { ColonySceneState } from './types'
import type { MainScene } from './scene'

export function setupEventListeners(scene: MainScene, state: ColonySceneState) {
	// Building events
	state.gameStore.on('building:start', (draft: any) => {
		scene.showBuildingPreview(draft)
	})

	state.gameStore.on('building:preview', () => {
		scene.updateBuildingPreview(
			state.gameStore.buildingDraft,
			state.gameStore.draftPosition
		)
	})

	state.gameStore.on('building:placed', () => {
		scene.hideBuildingPreview()
		scene.syncFromStore()
	})

	state.gameStore.on('building:cancelled', () => {
		scene.hideBuildingPreview()
	})

	// Movement events
	state.gameStore.on('movement:start', (entityId: string) => {
		scene.startMovementMode(entityId)
	})

	state.gameStore.on('movement:preview', () => {
		scene.updateMovementPreview(
			state.gameStore.movingEntityId,
			state.gameStore.moveTargetPos
		)
	})

	state.gameStore.on('movement:completed', () => {
		scene.hideMovementMode()
		scene.syncFromStore()
	})

	state.gameStore.on('movement:cancelled', () => {
		scene.hideMovementMode()
	})

	// Selection events
	state.gameStore.on('entity:selected', (entityId: string) => {
		scene.highlightEntity(entityId)
	})

	state.gameStore.on('entity:deselected', () => {
		scene.clearHighlight()
	})

	state.gameStore.on('entity:deleted', () => {
		scene.syncFromStore()
	})
}
