<template>
	<div>
		<div
			id="game-container"
			class="w-full h-full flex justify-center items-center"
		></div>
	</div>
</template>
<script setup lang="ts">
import { ColonyScene } from '~/scenes/ColonyScene'

let game: ColonyScene | undefined = undefined
onMounted(() => {
	game = new ColonyScene('game-container')
})

onUnmounted(() => {
	if (game) {
		game.destroy()
	}
})
</script>
<style scoped lang="css"></style>
