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
import { ColonyScene } from '~/scenes/ColonyScene/index'
import { useEcsStore } from '~/store/ecs'
import { useGameStore } from '~/store/game'
import { useUiStore } from '~/store/ui'
import { useAssetsStore } from '~/store/assets'

definePageMeta({
	layout: 'blank',
})

const game = ref<ColonyScene | undefined>(undefined)
const ecsStore = useEcsStore()
const gameStore = useGameStore()
const uiStore = useUiStore()
const assetsStore = useAssetsStore()

const handleResize = () => {
	game.value?.resize()
}

onMounted(() => {
	game.value = new ColonyScene('game-container', {
		ecsStore,
		gameStore,
		uiStore,
		assetsStore,
	})

	/*
	//! TEMPORARY
	if (game.value?.scene) {
		//@ts-ignore
		game.value.scene.router = useRouter()
		console.log('Router attached to scene')
	}*/

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
