// app/store/ecs.ts
import { defineStore } from 'pinia'
import _ from 'lodash'

type BoundingBox = {
	leftTop: { x: number; y: number }
	rightBottom: { x: number; y: number }
}
type EmptyC = {}
type NullC = undefined

// #region Components Config
export interface PrefabComponentRegistry {
	WorldC: EmptyC
	ItemC: {
		mass: number
		volume: number
		collisionBox: BoundingBox
	}
	VisualC: {
		texture: string
	}
	ControlC: EmptyC
	HealthC: {
		max: number
	}
	BuildableC: EmptyC
}

export interface EntityComponentRegistry {
	WorldC: {
		x: number
		y: number
	}
	ItemC: {
		amount: number
	}
	VisualC: EmptyC
	ControlC: {
		controller: string
		owner: string
	}
	HealthC: {
		current: number
	}
	BuildableC: EmptyC
}

const COMPONENT_DEFAULTS = {
	WorldC: () => ({ x: 0, y: 0 }),
	ItemC: () => ({ amount: 1 }),
	VisualC: () => ({}),
	ControlC: () => ({ controller: '', owner: '' }),
	HealthC: () => ({ current: 100 }),
	BuildableC: () => ({}),
}
// #endregion

export type PrefabComponent =
	| EntityComponentRegistry[keyof EntityComponentRegistry]
	| undefined

export type EntityComponent =
	| EntityComponentRegistry[keyof EntityComponentRegistry]
	| undefined

export type ComponentOf<
	T extends Entity | Prefab | EntityDraft,
	K extends keyof any
> = T extends Entity
	? EntityComponentRegistry[K & keyof EntityComponentRegistry]
	: T extends EntityDraft
	? EntityComponentRegistry[K & keyof EntityComponentRegistry]
	: T extends Prefab
	? PrefabComponentRegistry[K & keyof PrefabComponentRegistry]
	: never

export type Prefab = {
	name: string
	components: Partial<PrefabComponentRegistry>
}

export type EntityDraft = Omit<Entity, 'id'> & { id?: string }

export type Entity = {
	id: string
	prefab: Prefab
	components: Partial<EntityComponentRegistry>
}

export const useEcsStore = defineStore('ecs', {
	state: () => ({
		prefabs: [
			{
				name: 'factory',
				components: {
					VisualC: { texture: 'factory' },
					BuildableC: {},
				},
			},
			{
				name: 'quarry',
				components: {
					VisualC: { texture: 'quarry' },
					BuildableC: {},
				},
			},
			{
				name: 'house',
				components: {
					VisualC: { texture: 'house' },
					BuildableC: {},
				},
			},
			{
				name: 'errorobj',
				components: {
					VisualC: { texture: 'aiosjjf' },
					BuildableC: {},
				},
			},
		] as Prefab[],
		entities: [] as Entity[],
		_entityCount: 0,
	}),

	getters: {},

	actions: {
		// ===== FETCH ACTIONS =====
		getEntityById(id: string): Entity | undefined {
			return this.entities.find((e) => e.id === id)
		},

		getPrefabByName(name: string): Prefab | undefined {
			return this.prefabs.find((p) => p.name === name)
		},

		// ===== COMPONENT ACCESS (STRICT) =====
		getComponent<
			T extends Entity | Prefab | EntityDraft,
			K extends keyof EntityComponentRegistry | keyof PrefabComponentRegistry
		>(obj: T | undefined, component: K): ComponentOf<T, K> {
			if (!obj) throw new Error('Entity, Draft, or Prefab is undefined')

			const c = obj.components[component as keyof typeof obj.components]

			if (c === undefined) {
				throw new Error(
					`'${String(component)}' component is missing on ${
						'prefab' in obj ? 'Prefab' : 'Entity/Draft'
					}`
				)
			}

			return c as ComponentOf<T, K>
		},

		// ===== COMPONENT ACCESS (OPTIONAL) =====
		tryGetComponent<
			T extends Entity | Prefab | EntityDraft,
			K extends keyof EntityComponentRegistry | keyof PrefabComponentRegistry
		>(obj: T | undefined, component: K): ComponentOf<T, K> | undefined {
			if (!obj) return undefined
			return obj.components[component as keyof typeof obj.components] as
				| ComponentOf<T, K>
				| undefined
		},

		// ===== COMPONENT CHECKS =====
		hasComponent(
			obj: Entity | Prefab | EntityDraft | undefined,
			component: string
		): boolean {
			if (!obj) return false

			return (
				obj.components[component as keyof typeof obj.components] !== undefined
			)
		},

		// ===== COMPONENT INITIALIZATION =====
		initComponent(component: string): EntityComponent | undefined {
			const factory = (COMPONENT_DEFAULTS as any)[component]
			if (typeof factory === 'function') {
				return factory()
			}
			return undefined
		},

		// ===== COMPONENT QUERIES =====
		getPrefabsWithComponent(component: string): Prefab[] {
			return this.prefabs.filter((p) => this.hasComponent(p, component))
		},

		getEntitiesWithComponent(component: string): Entity[] {
			return this.entities.filter((e) => this.hasComponent(e, component))
		},

		// ===== DRAFT MANAGEMENT =====
		createDraft(prefabName: string): EntityDraft {
			const prefab = this.getPrefabByName(prefabName)
			if (!prefab) {
				throw new Error(`Prefab '${prefabName}' not found`)
			}

			const components: Partial<EntityComponentRegistry> = {}

			// Initialize all components from prefab template
			for (const componentName of Object.keys(prefab.components)) {
				const initialized = this.initComponent(componentName)
				//@ts-ignore
				components[componentName as keyof EntityComponentRegistry] = initialized
			}

			// Always ensure WorldC exists for entities
			if (!components['WorldC']) {
				components['WorldC'] = { x: 0, y: 0 }
			}

			return {
				prefab,
				components,
			}
		},

		updateDraft<K extends keyof EntityComponentRegistry>(
			draft: EntityDraft,
			component: K,
			value: EntityComponentRegistry[K]
		): void {
			draft.components[component] = value
		},

		discardDraft(draft: EntityDraft): void {
			// Cleanup if needed
		},

		// ===== ENTITY CREATION (LOCAL) =====
		commitDraft(draft: EntityDraft): Entity {
			const entity: Entity = {
				id: draft.id ?? String(this._entityCount++),
				prefab: draft.prefab,
				components: draft.components,
			}
			this.entities.push(entity)
			return entity
		},

		createEntity(e: Entity): Entity {
			const newEntity: Entity = {
				id: String(this._entityCount++),
				prefab: e.prefab,
				components: e.components,
			}
			this.entities.push(newEntity)
			return newEntity
		},

		deleteEntity(id: string): void {
			this.entities = this.entities.filter((e) => e.id !== id)
		},

		// ===== LEGACY ENTITY CREATION (FROM PREFAB) =====
		entityFromPrefab(prefabName: string): Entity {
			const prefab = this.getPrefabByName(prefabName)
			if (!prefab) {
				throw new Error(`Prefab '${prefabName}' not found`)
			}

			const components: Partial<EntityComponentRegistry> = {}

			// Initialize all components from prefab template
			for (const componentName of Object.keys(prefab.components)) {
				const initialized = this.initComponent(componentName)
				//@ts-ignore
				components[componentName as keyof EntityComponentRegistry] = initialized
			}

			// Always ensure WorldC exists for entities
			if (!components['WorldC']) {
				components['WorldC'] = { x: 0, y: 0 }
			}

			return {
				id: '0',
				prefab,
				components,
			}
		},

		// ===== SUBMISSION (LOCAL ONLY) =====
		async submitEntity(draft: EntityDraft): Promise<Entity> {
			// Simulate async operation for future GraphQL integration
			await new Promise((resolve) => setTimeout(resolve, 100))

			// Generate ID locally
			draft.id = String(this._entityCount++)

			return this.commitDraft(draft)
		},

		// ===== DELETION (LOCAL ONLY) =====
		async deleteEntityFromServer(id: string): Promise<void> {
			// Simulate async operation for future GraphQL integration
			await new Promise((resolve) => setTimeout(resolve, 100))

			// Remove from local store
			this.deleteEntity(id)
		},
	},
})
