<template>
	<div
		class="fixed right-0 top-0 h-screen w-96 bg-gray-900 border-l border-gray-700 flex flex-col"
	>
		<!-- Header -->
		<div class="border-b border-gray-700 p-4">
			<h2 class="text-xl font-bold text-white mb-4">ECS Editor</h2>

			<!-- Tab Switcher -->
			<UButtonGroup
				size="sm"
				orientation="horizontal"
				class="w-full"
			>
				<UButton
					v-for="tab in tabs"
					:key="tab"
					:severity="activeTab === tab ? 'primary' : 'secondary'"
					:variant="activeTab === tab ? 'solid' : 'ghost'"
					@click="activeTab = tab"
					class="flex-1"
				>
					{{ tab === 'prefabs' ? 'Prefabs' : 'Entities' }}
				</UButton>
			</UButtonGroup>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto">
			<!-- Prefabs Tab -->
			<div
				v-if="activeTab === 'prefabs'"
				class="p-4 space-y-2"
			>
				<button
					v-for="prefab in store.prefabs"
					:key="prefab.name"
					@click="selectPrefab(prefab)"
					:class="{
						'bg-blue-600': selectedPrefab?.name === prefab.name,
						'bg-gray-800 hover:bg-gray-700':
							selectedPrefab?.name !== prefab.name,
					}"
					class="w-full text-left px-3 py-2 rounded text-white transition"
				>
					{{ prefab.name }}
				</button>
			</div>

			<!-- Entities Tab -->
			<div
				v-else
				class="p-4 space-y-2"
			>
				<button
					v-for="entity in store.entities"
					:key="entity.id"
					@click="selectEntity(entity)"
					:class="{
						'bg-blue-600': selectedEntity?.id === entity.id,
						'bg-gray-800 hover:bg-gray-700': selectedEntity?.id !== entity.id,
					}"
					class="w-full text-left px-3 py-2 rounded text-white transition"
				>
					<span class="font-mono text-sm">{{ entity.id }}</span>
					<span class="text-gray-400 mx-1">/</span>
					<span class="text-gray-300">{{ entity.prefab.name }}</span>
				</button>
			</div>
		</div>

		<!-- Inspector -->
		<div
			v-if="selectedPrefab || selectedEntity"
			class="border-t border-gray-700 flex-1 overflow-y-auto p-4"
		>
			<!-- Prefab Inspector -->
			<div
				v-if="selectedPrefab"
				class="space-y-4"
			>
				<div class="pb-4 border-b border-gray-700">
					<h3 class="text-lg font-bold text-white">
						{{ selectedPrefab.name }}
					</h3>
				</div>

				<div class="space-y-4">
					<div
						v-for="(componentValue, componentName) in selectedPrefab.components"
						:key="componentName"
						class="bg-gray-800 rounded p-3"
					>
						<h4 class="font-bold text-white mb-2">
							{{ componentName }}
						</h4>
						<EcsComponentEditor
							:value="componentValue"
							:component-name="componentName"
							@update="
								// @ts-ignore
								;(v) => updatePrefabComponent(selectedPrefab, componentName, v)
							"
						/>
					</div>
				</div>
			</div>

			<!-- Entity Inspector -->
			<div
				v-else-if="selectedEntity"
				class="space-y-4"
			>
				<div class="pb-4 border-b border-gray-700">
					<div class="space-y-2">
						<div>
							<p class="text-gray-400 text-sm">ID</p>
							<p class="text-white font-mono">{{ selectedEntity.id }}</p>
						</div>
						<div>
							<p class="text-gray-400 text-sm">Prefab</p>
							<button
								@click="goToPrefab(selectedEntity.prefab)"
								class="text-blue-400 hover:text-blue-300 font-mono underline"
							>
								{{ selectedEntity.prefab.name }}
							</button>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<div
						v-for="(componentValue, componentName) in selectedEntity.components"
						:key="componentName"
						class="bg-gray-800 rounded p-3"
					>
						<h4 class="font-bold text-white mb-2">
							{{ componentName }}
						</h4>
						<ComponentEditor
							:value="componentValue"
							:component-name="componentName"
							@update="
								// @ts-ignore
								;(v) => updateEntityComponent(selectedEntity, componentName, v)
							"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div
			v-else
			class="flex-1 flex items-center justify-center text-gray-500"
		>
			<p>
				Select a {{ activeTab === 'prefabs' ? 'prefab' : 'entity' }} to inspect
			</p>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useEcsStore, type Prefab, type Entity } from '~/store/ecs'

const store = useEcsStore()
const activeTab = ref<'prefabs' | 'entities'>('prefabs')
const selectedPrefab = ref<Prefab | undefined>(undefined)
const selectedEntity = ref<Entity | undefined>(undefined)
const tabs = ['prefabs', 'entities'] as const

const selectPrefab = (prefab: Prefab) => {
	selectedPrefab.value = prefab
	selectedEntity.value = undefined
}

const selectEntity = (entity: Entity) => {
	selectedEntity.value = entity
	selectedPrefab.value = undefined
}

const goToPrefab = (prefab: Prefab) => {
	activeTab.value = 'prefabs'
	selectPrefab(prefab)
}

const updatePrefabComponent = (
	prefab: Prefab,
	componentName: string,
	value: any
) => {
	//@ts-ignore
	prefab.components[componentName as keyof any] = value
}

const updateEntityComponent = (
	entity: Entity,
	componentName: string,
	value: any
) => {
	//@ts-ignore
	entity.components[componentName as keyof any] = value
}
</script>
