<template>
	<div
		class="fixed bottom-0 left-0 h-64 w-full bg-black/70 border-t border-gray-700 p-4"
	>
		<div class="flex gap-4 h-full">
			<!-- Building Selection Panel -->
			<div class="flex gap-2 overflow-x-auto pb-2">
				<div
					v-for="building in buildings"
					:key="building.name"
					class="flex-shrink-0"
				>
					<UButton
						@click="selectBuilding(building)"
						:color="
							currentBuilding?.name === building.name ? 'primary' : 'secondary'
						"
						:variant="
							currentBuilding?.name === building.name ? 'solid' : 'ghost'
						"
						size="lg"
						class="h-20 w-20"
					>
						<img
							:src="`textures/colony/${building.components.VisualC?.texture}.png`"
							class="h-16 w-16 object-contain"
							:alt="building.name"
						/>
					</UButton>
				</div>
			</div>

			<!-- Info Panel -->
			<div
				v-if="selectedEntity"
				class="flex-1 bg-gray-900 rounded p-4"
			>
				<h3 class="text-lg font-bold text-white mb-2">
					{{ selectedEntity.id }}
				</h3>
				<p class="text-gray-300 mb-4">
					Prefab:
					<span class="font-mono">{{ selectedEntity.prefab.name }}</span>
				</p>

				<div class="space-y-2 mb-4">
					<div>
						<p class="text-xs text-gray-400">Position</p>
						<p class="text-white font-mono">
							Q: {{ worldC?.x ?? 'N/A' }}, R: {{ worldC?.y ?? 'N/A' }}
						</p>
					</div>
				</div>

				<UButton
					color="error"
					@click="deleteSelectedEntity"
					:loading="isDeleting"
					block
				>
					Delete Building
				</UButton>
			</div>

			<!-- Placement Help -->
			<div
				v-else-if="isPlacingBuilding"
				class="flex-1 bg-yellow-900/30 rounded p-4 flex items-center"
			>
				<p class="text-yellow-200">
					Click on the map to place <strong>{{ currentBuilding?.name }}</strong>
				</p>
			</div>

			<div
				v-else
				class="flex-1 text-gray-500 flex items-center"
			>
				<p>Select a building type to begin placing</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { useGameStore } from '~/store/game'
import { useEcsStore, type Prefab, type Entity } from '~/store/ecs'
import { useUiStore } from '~/store/ui'

const gameStore = useGameStore()
const ecsStore = useEcsStore()
const uiStore = useUiStore()

const buildings = ref<Prefab[]>([])
const currentBuilding = ref<Prefab | undefined>(undefined)
const isPlacingBuilding = computed(() => gameStore.isPlacingBuilding)
const selectedEntity = computed(() => gameStore.selectedEntity)
const isDeleting = ref(false)

const worldC = computed(() => {
	if (!selectedEntity.value) return undefined
	return ecsStore.tryGetComponent(selectedEntity.value, 'WorldC')
})

const selectBuilding = (building: Prefab) => {
	currentBuilding.value = building
	gameStore.startPlacingBuilding(building.name)
}

const deleteSelectedEntity = async () => {
	isDeleting.value = true
	try {
		await gameStore.deleteSelectedEntity()
		uiStore.addNotification('Building deleted', 'success')
	} catch (error) {
		uiStore.addNotification('Failed to delete building', 'error')
		console.error(error)
	} finally {
		isDeleting.value = false
	}
}

onMounted(() => {
	buildings.value = ecsStore.getPrefabsWithComponent('BuildableC')
	currentBuilding.value = buildings.value[0]

	// Listen to deselection
	gameStore.on('entity:deselected', () => {
		currentBuilding.value = buildings.value[0]
	})
})
</script>
