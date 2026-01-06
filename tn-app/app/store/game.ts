import { defineStore } from 'pinia'
import { useEcsStore, type EntityDraft, type Entity } from '~/store/ecs'

export type GameMode = 'normal' | 'building' | 'moving'

export const useGameStore = defineStore('game', {
	state: () => ({
		// Mode system
		mode: 'normal' as GameMode,

		// Building placement workflow
		buildingDraft: undefined as EntityDraft | undefined,
		draftPosition: undefined as { q: number; r: number } | undefined,

		// Movement workflow
		movingEntityId: undefined as string | undefined,
		moveTargetPos: undefined as { q: number; r: number } | undefined,

		// Selection
		selectedEntityId: undefined as string | undefined,

		// Scene state
		hoveredPos: undefined as { q: number; r: number } | undefined,

		// Event bus
		_events: new Map<string, Set<Function>>(),
	}),

	getters: {
		isPlacingBuilding: (state) => state.mode === 'building',
		isMoving: (state) => state.mode === 'moving',
		canPlaceBuilding: (state) => !!state.buildingDraft && !!state.draftPosition,
		canMove: (state) => !!state.moveTargetPos,
		selectedEntity: (state) => {
			if (!state.selectedEntityId) return undefined
			const ecs = useEcsStore()
			return ecs.getEntityById(state.selectedEntityId)
		},
	},

	actions: {
		// ===== BUILDING ACTIONS =====
		startPlacingBuilding(prefabName: string) {
			const ecs = useEcsStore()
			const draft = ecs.createDraft(prefabName)
			this.mode = 'building'
			this.buildingDraft = draft
			this.draftPosition = undefined
			this.emit('building:start', draft)
		},

		updatePlacementPosition(pos: { q: number; r: number }) {
			if (!this.buildingDraft) return
			this.draftPosition = pos

			// Actually update the draft's WorldC
			const ecs = useEcsStore()
			const world = ecs.getComponent(this.buildingDraft, 'WorldC')
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
			this.mode = 'normal'
		},

		// ===== MOVEMENT ACTIONS =====
		startMovementMode(entityId: string) {
			const ecs = useEcsStore()
			const entity = ecs.getEntityById(entityId)
			if (!entity) return

			const moveC = ecs.tryGetComponent(entity.prefab, 'MoveC')
			if (!moveC) return

			this.mode = 'moving'
			this.movingEntityId = entityId
			this.moveTargetPos = undefined
			this.emit('movement:start', entityId)
		},

		updateMovementTarget(pos: { q: number; r: number }) {
			if (!this.movingEntityId) return

			const ecs = useEcsStore()
			const entity = ecs.getEntityById(this.movingEntityId)
			if (!entity) return

			const moveC = ecs.tryGetComponent(entity.prefab, 'MoveC')
			if (!moveC) return

			const worldc = ecs.getComponent(entity, 'WorldC')
			const distance = Math.abs(pos.q - worldc.x) + Math.abs(pos.r - worldc.y)

			// Only update if within range
			if (distance <= moveC.distance) {
				this.moveTargetPos = pos
				this.emit('movement:preview', pos)
			}
		},

		async confirmMovement(pos: { q: number; r: number }) {
			if (!this.movingEntityId) return
			const ecs = useEcsStore()

			const entity = ecs.getEntityById(this.movingEntityId)
			if (!entity) return

			const moveC = ecs.tryGetComponent(entity.prefab, 'MoveC')
			if (!moveC) return

			const worldc = ecs.getComponent(entity, 'WorldC')
			const distance = Math.abs(pos.q - worldc.x) + Math.abs(pos.r - worldc.y)

			// Validate movement
			if (distance > moveC.distance) {
				this.emit('movement:failed', new Error('Target out of range'))
				return
			}

			try {
				// Update position locally
				worldc.x = pos.q
				worldc.y = pos.r

				// ✅ Emit event that tells the scene to re-render
				this.emit('movement:completed', entity)
				this.cancelMovement()
			} catch (error) {
				this.emit('movement:failed', error)
				throw error
			}
		},

		cancelMovement() {
			this.movingEntityId = undefined
			this.moveTargetPos = undefined
			this.mode = 'normal'
			this.emit('movement:cancelled')
		},

		// ===== SELECTION ACTIONS =====
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

		// ===== SCENE STATE =====
		updateHoveredPos(pos: { q: number; r: number } | undefined) {
			this.hoveredPos = pos
		},

		// ===== EVENT BUS =====
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
