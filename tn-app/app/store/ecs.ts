import { defineStore } from 'pinia'

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
// #endregion
/*const createRegistryKeys = <T>() => {
	return <U extends (keyof T)[]>(
		...args: U & (Exclude<keyof T, U[number]> extends never ? U : never)
	) => args
}
export const COMPONENT_NAMES = createRegistryKeys<PrefabComponentRegistry>()(
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

export type ComponentOf<
	T extends Entity | Prefab,
	K extends keyof any
> = T extends Entity
	? EntityComponentRegistry[K & keyof EntityComponentRegistry]
	: T extends Prefab
	? PrefabComponentRegistry[K & keyof PrefabComponentRegistry]
	: never

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
		/*getComponent<
			T extends Entity | Prefab,
			K extends keyof EntityComponentRegistry | keyof PrefabComponentRegistry,
			O extends boolean | undefined = false
		>(
			obj: T | undefined,
			component: K,
			optional?: O
		): O extends true ? ComponentOf<T, K> | undefined : ComponentOf<T, K> {
			if (!obj) {
				if (optional) return undefined as any
				throw new Error('Entity or Prefab is undefined')
			}

			const c = obj.components[component as keyof typeof obj.components]

			if (c === undefined && !optional) {
				throw new Error(
					`'${component}' component is missing on ${
						'prefab' in obj ? 'Prefab' : 'Entity'
					}`
				)
			}

			return c as ComponentOf<T, K>
		},*/
		getComponent<
			T extends Entity | Prefab,
			K extends keyof EntityComponentRegistry | keyof PrefabComponentRegistry
		>(obj: T | undefined, component: K): ComponentOf<T, K> {
			if (!obj) throw new Error('Entity or Prefab is undefined')
			const c = obj.components[component as keyof typeof obj.components]
			if (c === undefined) {
				throw new Error(`'${component}' component is missing`)
			}
			return c as ComponentOf<T, K>
		},
		tryGetComponent<
			T extends Entity | Prefab,
			K extends keyof EntityComponentRegistry | keyof PrefabComponentRegistry
		>(obj: T | undefined, component: K): ComponentOf<T, K> | undefined {
			if (!obj) return undefined
			return obj.components[component as keyof typeof obj.components] as
				| ComponentOf<T, K>
				| undefined
		},
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
		/*getComponent(
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
		},*/
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
		// first do entityFromComponent, then createEntity
		entityFromPrefab(prefabName: string): Entity {
			const prefab = this.getPrefabByName(prefabName) as Prefab | undefined
			if (!prefab) {
				throw new Error(`Prefab '${prefabName}' not found`)
			}
			return {
				id: '0',
				prefab: prefab,
				components: Object.fromEntries(
					Object.entries(prefab.components).map((v) => [
						v[0],
						this.initComponent(v[0]),
					])
				),
			}
		},
		createEntity(e: Entity): Entity {
			// do we just blindly trust that it has the correct components?
			const newEntity: Entity = {
				//id: crypto.randomUUID(),
				id: String(this._entityCount),
				prefab: e.prefab,
				components: e.components,
			}
			this._entityCount++
			this.entities.push(newEntity)
			return newEntity
		},
	},
})
