<template>
	<div>
		<div id="game-container"></div>
	</div>
</template>
<script setup lang="ts">
import { ColonyScene } from '~/scenes/ColonyScene4'
import { useEcsStore } from '~/store/ecs'

const game = ref<ColonyScene | undefined>(undefined)
const store = useEcsStore()

onMounted(() => {
	game.value = new ColonyScene('game-container', {
		store,
	})
	window.addEventListener('resize', game.value.resize)
})

onUnmounted(() => {
	if (game.value) {
		game.value.destroy()
		window.removeEventListener('resize', game.value.resize)
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
