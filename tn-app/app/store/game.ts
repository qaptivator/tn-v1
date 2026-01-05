import { defineStore } from 'pinia'
import { useEcsStore, type EntityDraft, type Entity } from '~/store/ecs'

export const useGameStore = defineStore('game', {
	state: () => ({
		// Building placement workflow
		buildingDraft: undefined as EntityDraft | undefined,
		draftPosition: undefined as { q: number; r: number } | undefined,
		isPlacingBuilding: false,

		// Selection
		selectedEntityId: undefined as string | undefined,

		// Scene state
		hoveredPos: undefined as { q: number; r: number } | undefined,

		// Event bus
		_events: new Map<string, Set<Function>>(),
	}),

	getters: {
		canPlaceBuilding: (state) => !!state.buildingDraft && !!state.draftPosition,
		selectedEntity: (state) => {
			if (!state.selectedEntityId) return undefined
			const ecs = useEcsStore()
			return ecs.getEntityById(state.selectedEntityId)
		},
	},

	actions: {
		// Building placement
		startPlacingBuilding(prefabName: string) {
			const ecs = useEcsStore()
			const draft = ecs.createDraft(prefabName)
			this.buildingDraft = draft
			this.isPlacingBuilding = true
			this.emit('building:start', draft)
		},

		updatePlacementPosition(pos: { q: number; r: number }) {
			if (!this.buildingDraft) return
			this.draftPosition = pos
			const world = useEcsStore().getComponent(this.buildingDraft, 'WorldC')
			world.x = pos.q
			world.y = pos.r
			this.emit('building:preview', pos)
		},

		async confirmPlacement() {
			if (!this.buildingDraft) return
			const ecs = useEcsStore()

			// Check if there's already a building at this position
			const existingBuilding = ecs.entities.find((e) => {
				const world = ecs.tryGetComponent(e, 'WorldC')
				const draftWorld = ecs.getComponent(this.buildingDraft, 'WorldC')
				return world && world.x === draftWorld.x && world.y === draftWorld.y
			})

			if (existingBuilding) {
				this.emit('building:failed', new Error('Position already occupied'))
				return
			}

			try {
				await ecs.submitEntity(this.buildingDraft)
				this.emit('building:placed', this.buildingDraft)
				this.clearPlacement()
			} catch (error) {
				this.emit('building:failed', error)
				throw error
			}
		},

		cancelPlacement() {
			this.clearPlacement()
			this.emit('building:cancelled')
		},

		clearPlacement() {
			this.buildingDraft = undefined
			this.draftPosition = undefined
			this.isPlacingBuilding = false
		},

		// Selection
		selectEntity(entityId: string) {
			// If clicking the same entity, deselect it
			if (this.selectedEntityId === entityId) {
				this.deselectEntity()
				return
			}

			this.selectedEntityId = entityId
			this.emit('entity:selected', entityId)
		},

		deselectEntity() {
			this.selectedEntityId = undefined
			this.emit('entity:deselected')
		},

		async deleteSelectedEntity() {
			if (!this.selectedEntityId) return
			const ecs = useEcsStore()

			try {
				await ecs.deleteEntityFromServer(this.selectedEntityId)
				this.emit('entity:deleted', this.selectedEntityId)
				this.deselectEntity()
			} catch (error) {
				this.emit('entity:delete-failed', error)
				throw error
			}
		},

		// Scene state
		updateHoveredPos(pos: { q: number; r: number } | undefined) {
			this.hoveredPos = pos
		},

		// Event bus
		on(event: string, callback: Function) {
			if (!this._events.has(event)) {
				this._events.set(event, new Set())
			}
			this._events.get(event)!.add(callback)
		},

		off(event: string, callback: Function) {
			this._events.get(event)?.delete(callback)
		},

		emit(event: string, ...args: any[]) {
			this._events.get(event)?.forEach((cb) => cb(...args))
		},
	},
})
