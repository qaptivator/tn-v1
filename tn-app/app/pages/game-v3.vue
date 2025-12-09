<template>
	<div id="game-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { ColonyScene } from '~/scenes/ColonyScene3'

const game = ref<ColonyScene | undefined>(undefined)

onMounted(() => {
	game.value = new ColonyScene('game-container')
})

onUnmounted(() => {
	if (game.value) {
		game.value.destroy()
	}
})
</script>

<style scoped>
#game-container {
	width: 100vw;
	height: 100vh;
	margin: 0;
	padding: 0;
}
</style>
