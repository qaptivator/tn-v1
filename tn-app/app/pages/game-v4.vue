<template>
	<div>
		<div id="game-container"></div>
		<div class="fixed bottom-0 left-0 h-64 w-96 bg-black/50 flex p-4 gap-4">
			<img
				v-for="building in buildings"
				@click="currentBuilding = building"
				:src="`textures/colony/${building.components.VisualC?.texture}.png`"
				class="h-16 ring-white"
				:class="currentBuilding?.name === building.name ? 'ring-2' : ''"
			/>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ColonyScene } from '~/scenes/ColonyScene4'
import { useEcsStore, type Prefab } from '~/store/ecs'

// TODO: check currentBulding not by name, but by id (requires a factory function for prefabs)
const game = ref<ColonyScene | undefined>(undefined)
const buildings = ref<Prefab[]>([])
const currentBuilding = ref<Prefab | undefined>(undefined)
const store = useEcsStore()

const onClick = () => {
	const pos = game.value?.scene.hoveredPos
	if (!currentBuilding.value || !pos) return

	const e = store.createEntity(currentBuilding.value.name)
	if (!e?.components.WorldC) return
	e.components.WorldC.x = pos.q
	e.components.WorldC.y = pos.r

	//! DO NOT do this
	store.entities.push(e)
	game.value?.scene.syncFromStore()
}

onMounted(() => {
	buildings.value = store.getPrefabsWithComponent('BuildableC')
	currentBuilding.value = buildings.value[0]
	game.value = new ColonyScene('game-container', {
		store,
	})
	window.addEventListener('resize', game.value.resize)
	window.addEventListener('click', onClick)
})

onUnmounted(() => {
	if (game.value) {
		game.value.destroy()
		window.removeEventListener('resize', game.value.resize)
		window.removeEventListener('click', onClick)
	}
})
</script>
<style scoped lang="css">
#game-container {
	width: 100vw;
	height: 100vh;
	margin: 0;
	padding: 0;
}
</style>
