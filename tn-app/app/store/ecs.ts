import { defineStore } from 'pinia'

const createRegistryKeys = <T>() => {
	return <U extends (keyof T)[]>(
		...args: U & (Exclude<keyof T, U[number]> extends never ? U : never)
	) => args
}
type BoundingBox = {
	leftTop: { x: number; y: number }
	rightBottom: { x: number; y: number }
}

type EmptyC = {}
export interface PrefabComponentRegistry {
	WorldC: EmptyC
	ItemC: {
		// mass and volume per 1 item, kind of terranations's version of moles
		// prefab.density = prefab.mass / prefab.volume
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
		// colony: string
		// rotation: number
	}
	ItemC: {
		// entity.mass = prefab.mass * entity.amount
		// entity.volume = prefab.volume * entity.amount
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
const COMPONENT_DEFAULTS: {
	[key: string]: EntityComponent | EmptyC
} = {
	WorldC: {
		x: 0,
		y: 0,
	},
	ItemC: {
		amount: 1,
	},
	VisualC: {},
	ControlC: {
		controller: '',
		owner: '',
	},
	HealthC: {
		current: 100,
	},
	BuildableC: {},
}
/*export const COMPONENT_NAMES = createRegistryKeys<PrefabComponentRegistry>()(
	'WorldC',
	'ItemC',
	'VisualC',
	'ControlC',
	'HealthC',
	'BuildableC'
)*/

export type PrefabComponent =
	| EntityComponentRegistry[keyof EntityComponentRegistry]
	| undefined
export type EntityComponent =
	| EntityComponentRegistry[keyof EntityComponentRegistry]
	| undefined

export type Prefab = {
	name: string
	components: Partial<PrefabComponentRegistry>
}

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
					WorldC: {},
					BuildableC: {},
				},
			},
			{
				name: 'quarry',
				components: {
					VisualC: { texture: 'quarry' },
					WorldC: {},
					BuildableC: {},
				},
			},
			{
				name: 'house',
				components: {
					VisualC: { texture: 'house' },
					WorldC: {},
					BuildableC: {},
				},
			},
			{
				name: 'errorobj',
				components: {
					VisualC: { texture: 'aiosjjf' },
					WorldC: {},
					BuildableC: {},
				},
			},
		] as Prefab[],
		entities: [] as Entity[],
		_entityCount: 0,
	}),
	getters: {},
	actions: {
		// fetch
		getEntityById(id: string): Entity | undefined {
			return this.entities.find((e) => e.id === id)
		},
		getPrefabByName(name: string): Prefab | undefined {
			return this.prefabs.find((p) => p.name === name)
		},

		// core
		hasComponent(obj: Entity | Prefab, component: string): boolean {
			if ('prefab' in obj) {
				return (
					obj.components[component as keyof EntityComponentRegistry] !==
					undefined
				)
			} else {
				return (
					obj.components[component as keyof PrefabComponentRegistry] !==
					undefined
				)
			}
		},
		getComponent(
			obj: Entity | Prefab,
			component: keyof EntityComponentRegistry | keyof PrefabComponentRegistry
		) {
			if ('prefab' in obj) {
				// Entity
				return obj.components[component as keyof EntityComponentRegistry]
			} else {
				// Prefab
				return obj.components[component as keyof PrefabComponentRegistry]
			}
		},
		initComponent(component: string): EntityComponent | undefined {
			// initialize default values for components when creating an entity
			// there isnt such function for prefabs, because they will be defined manually, and shouldn't have a fallback
			/*switch (component) {
				case 'WorldC':
					return { x: 0, y: 0 }
				case 'ItemC':
					return { amount: 1 }
				case 'VisualC':
					return {}
				case 'ControlC':
					return { controller: '', owner: '' }
				case 'HealthC':
					return { current: 100 }
				default:
					return undefined
			}*/
			return (COMPONENT_DEFAULTS as any)[component]
		},
		getPrefabsWithComponent(component: string): Prefab[] {
			return this.prefabs.filter((p) => this.hasComponent(p, component))
		},
		getEntitiesWithComponent(component: string): Entity[] {
			return this.entities.filter((e) => this.hasComponent(e, component))
		},

		// prefab management
		// does NOT push it automatically
		createEntity(prefabName: string): Entity | undefined {
			const prefab = this.getPrefabByName(prefabName) as Prefab | undefined
			if (!prefab) return undefined

			const newEntity: Entity = {
				//id: crypto.randomUUID(),
				id: String(this._entityCount),
				prefab,
				components: Object.fromEntries(
					Object.entries(prefab.components).map((v) => [
						v[0],
						this.initComponent(v[0]),
					])
				),
			}
			this._entityCount++

			//this.entities.push(newEntity)
			return newEntity
		},
	},
})
