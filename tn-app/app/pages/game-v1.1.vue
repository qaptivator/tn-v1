<template>
	<div class="w-full h-screen bg-slate-900 overflow-hidden">
		<!-- Game Container -->
		<div
			id="game-container"
			class="w-full h-full flex justify-center items-center"
		></div>

		<!-- UI Layer -->
		<div
			id="ui-layer"
			class="absolute inset-0 pointer-events-none"
		>
			<!-- Top Left Panel -->
			<div
				id="top-left-panel"
				class="absolute top-5 left-5 w-72 flex flex-col gap-2.5 pointer-events-auto bg-black/85 border-2 border-gray-500 p-3 rounded-lg backdrop-blur-sm shadow-lg"
			>
				Count: {{ count }}
				<!-- Turn Info -->
				<div
					id="turn-info"
					class="bg-slate-900 px-3 py-2 rounded flex justify-between items-center"
				>
					<span class="text-base text-gray-300">DEFENSE TURN</span>
					<span
						id="turn-count"
						class="text-2xl font-black text-yellow-400 drop-shadow-lg"
						>1/5</span
					>
				</div>

				<!-- Power Grid Status -->
				<div>
					<div class="flex justify-between text-xs text-gray-500 mb-0.5">
						<span>POWER GRID</span>
						<span id="grid-percent">100%</span>
					</div>
					<div
						class="w-full h-4 bg-slate-800 border border-gray-600 rounded overflow-hidden"
					>
						<div
							id="grid-bar"
							class="h-full bg-yellow-600 transition-all duration-300"
							style="width: 100%"
						></div>
					</div>
				</div>

				<!-- Enemy Intent -->
				<div class="text-xs text-gray-500">
					<span id="enemy-intent-list">Enemies are preparing...</span>
				</div>

				<!-- Buttons -->
				<UButton
					id="btn-end-turn"
					label="End Turn"
					class="w-full"
					@click="game?.scene?.endPlayerTurn()"
				>
				</UButton>
				<UButton
					id="btn-undo-move"
					label="Undo Move"
					class="w-full"
					disabled
					@click="game?.scene?.undoMove()"
				>
				</UButton>
			</div>

			<!-- Bottom Left: Unit Actions -->
			<div
				id="unit-actions"
				class="absolute bottom-5 left-5 w-72 pointer-events-auto bg-black/85 border-2 border-gray-500 p-3 rounded-lg backdrop-blur-sm shadow-lg hidden"
			>
				<h1
					id="selected-unit-name"
					class="m-0 mb-2.5 text-lg font-bold text-white uppercase tracking-wider"
				>
					MECH
				</h1>
				<div class="flex gap-2">
					<UButton
						id="btn-attack"
						label="Attack (E)"
						@click="game?.scene?.enterAttackMode()"
					>
					</UButton>
				</div>
				<p
					id="action-desc"
					class="text-xs text-gray-600 mt-1"
				>
					Select a target to fire. Press Q/Right-Click to Cancel.
				</p>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { ColonyScene } from '~/scenes/ColonyScene'

const count = ref(0)
const game = ref<ColonyScene | undefined>()
// note: this simply doesnt work
//const scene = computed(() => game.value?.scene)
onMounted(() => {
	game.value = new ColonyScene('game-container', { count })
})

onUnmounted(() => {
	if (game.value) {
		game.value.destroy()
	}
})

function endTurn() {
	console.log('endTurn', game.value, game.value?.scene)
	game.value?.scene?.endPlayerTurn()
}
</script>
<style scoped lang="css"></style>
