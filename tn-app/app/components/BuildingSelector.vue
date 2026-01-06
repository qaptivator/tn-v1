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

			<!-- Info Panel - Selected Entity -->
			<div
				v-if="selectedEntity"
				class="flex-1 bg-gray-900 rounded p-4 flex flex-col"
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

				<!-- Action Buttons -->
				<div class="space-y-2 flex-1 flex flex-col">
					<!-- Move Button -->
					<UButton
						v-if="hasMoveC && gameStore.mode === 'normal'"
						color="primary"
						@click="startMovement"
					>
						Move
					</UButton>

					<!-- Delete Button -->
					<UButton
						color="error"
						@click="deleteSelectedEntity"
						:loading="isDeleting"
						block
					>
						Delete Building
					</UButton>
				</div>
			</div>

			<!-- Info Panel - Movement Mode -->
			<div
				v-else-if="gameStore.mode === 'moving'"
				class="flex-1 bg-blue-900/30 rounded p-4 flex flex-col"
			>
				<p class="text-blue-200 mb-4">
					<strong>Movement Mode</strong>
				</p>
				<div class="space-y-2 mb-4 text-sm text-blue-100">
					<div>
						From:
						<span class="font-mono">{{ fromPos?.x }}, {{ fromPos?.y }}</span>
					</div>
					<div v-if="moveTargetPos">
						To:
						<span class="font-mono"
							>{{ moveTargetPos.q }}, {{ moveTargetPos.r }}</span
						>
					</div>
					<div>
						Range: <span class="font-mono">{{ moveDistance }} tiles</span>
					</div>
				</div>
				<UButton
					color="secondary"
					@click="cancelMovement"
					class="mt-auto"
				>
					Cancel Movement
				</UButton>
			</div>

			<!-- Placement Help -->
			<div
				v-else-if="gameStore.mode === 'building'"
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
const isDeleting = ref(false)

const selectedEntity = computed(() => gameStore.selectedEntity)
const moveTargetPos = computed(() => gameStore.moveTargetPos)

const worldC = computed(() => {
	if (!selectedEntity.value) return undefined
	return ecsStore.tryGetComponent(selectedEntity.value, 'WorldC')
})

const hasMoveC = computed(() => {
	if (!selectedEntity.value) return false
	return ecsStore.hasComponent(selectedEntity.value.prefab, 'MoveC')
})

const fromPos = computed(() => {
	if (!gameStore.movingEntityId) return undefined
	const entity = ecsStore.getEntityById(gameStore.movingEntityId)
	if (!entity) return undefined
	return ecsStore.tryGetComponent(entity, 'WorldC')
})

const moveDistance = computed(() => {
	if (!gameStore.movingEntityId) return 0
	const entity = ecsStore.getEntityById(gameStore.movingEntityId)
	if (!entity) return 0
	const moveC = ecsStore.tryGetComponent(entity.prefab, 'MoveC')
	return moveC?.distance ?? 0
})

const selectBuilding = (building: Prefab) => {
	currentBuilding.value = building
	gameStore.startPlacingBuilding(building.name)
}

const startMovement = () => {
	if (selectedEntity.value) {
		gameStore.startMovementMode(selectedEntity.value.id)
	}
}

const cancelMovement = () => {
	gameStore.cancelMovement()
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

	// Listen to movement mode end
	gameStore.on('movement:cancelled', () => {
		currentBuilding.value = buildings.value[0]
	})

	gameStore.on('movement:completed', () => {
		currentBuilding.value = buildings.value[0]
	})
})
</script>
