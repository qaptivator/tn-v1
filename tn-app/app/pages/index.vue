<template>
	<div class="relative w-full h-screen">
		<div
			id="game-container"
			class="w-full h-full"
		></div>
		<BuildingSelector />
		<NotificationCenter />
	</div>
</template>

<script setup lang="ts">
import { ColonyScene } from '~/scenes/ColonyScene4'
import { useEcsStore } from '~/store/ecs'
import { useGameStore } from '~/store/game'

definePageMeta({
	layout: 'blank',
})

const game = ref<ColonyScene | undefined>(undefined)
const ecsStore = useEcsStore()
const gameStore = useGameStore()

const handleResize = () => {
	game.value?.resize()
}

onMounted(() => {
	game.value = new ColonyScene('game-container', {
		store: ecsStore,
	})

	window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
	if (game.value) {
		game.value.destroy()
		window.removeEventListener('resize', handleResize)
	}
})
</script>

<style scoped>
#game-container {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
}
</style>
