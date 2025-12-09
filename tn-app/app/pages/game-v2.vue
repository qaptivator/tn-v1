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
					<span class="text-2xl font-black text-yellow-400 drop-shadow-lg"
						>{{ gameState.turn }}/{{ MAX_TURNS }}</span
					>
				</div>

				<!-- Power Grid Status -->
				<div>
					<div class="flex justify-between text-xs text-gray-500 mb-0.5">
						<span>POWER GRID</span>
						<span>{{ gridPercent }}%</span>
					</div>
					<div
						class="w-full h-4 bg-slate-800 border border-gray-600 rounded overflow-hidden"
					>
						<div
							class="h-full transition-all duration-300"
							:style="{
								width: gridPercent + '%',
								backgroundColor: gridPercent < 30 ? '#ff0000' : '#e6b800',
							}"
						></div>
					</div>
				</div>

				<!-- Enemy Intent -->
				<div class="text-xs text-gray-500">
					<span>{{
						gameState.enemiesAttacking > 0
							? `${gameState.enemiesAttacking} Threats detected!`
							: 'No imminent threats.'
					}}</span>
				</div>

				<!-- Buttons -->
				<UButton
					label="End Turn"
					class="w-full"
					:disabled="!gameState.playerTurn || gameState.gameOver"
					@click="game?.scene?.endPlayerTurn()"
				>
				</UButton>
				<UButton
					label="Undo Move"
					class="w-full"
					:disabled="!canUndoMove"
					@click="game?.scene?.undoMove()"
				>
				</UButton>
			</div>

			<!-- Bottom Left: Unit Actions -->
			<div
				v-if="gameState.selectedUnit"
				class="absolute bottom-5 left-5 w-72 pointer-events-auto bg-black/85 border-2 border-gray-500 p-3 rounded-lg backdrop-blur-sm shadow-lg"
			>
				<h1
					class="m-0 mb-2.5 text-lg font-bold text-white uppercase tracking-wider"
				>
					{{ gameState.selectedUnit.type.toUpperCase() }} MECH
				</h1>
				<div class="flex gap-2">
					<UButton
						:label="gameState.selectedUnit.acted ? 'ATTACKED' : 'ATTACK (E)'"
						:disabled="gameState.selectedUnit.acted"
						@click="game?.scene?.enterAttackMode()"
					>
					</UButton>
				</div>
				<p class="text-xs text-gray-600 mt-1">
					{{
						gameState.selectedUnit.moved
							? 'Unit moved. Select Attack target or Undo Move (Q/Right-Click to Cancel).'
							: 'Click Green tiles to Move. Press Q/Right-Click to Cancel.'
					}}
				</p>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ColonyScene } from '~/scenes/ColonyScene2'
import { reactive, ref, computed } from 'vue'

const MAX_TURNS = 5
const count = ref(0)
const game = ref<ColonyScene | undefined>()

const gameState = reactive({
	turn: 1,
	powerGrid: 7,
	maxPowerGrid: 7,
	gameOver: false,
	playerTurn: true,
	selectedUnit: null as any,
	enemiesAttacking: 0,
})

const gridPercent = computed(() =>
	Math.floor((gameState.powerGrid / gameState.maxPowerGrid) * 100)
)

const canUndoMove = computed(
	() =>
		gameState.selectedUnit &&
		gameState.selectedUnit.moved &&
		!gameState.selectedUnit.acted
)

onMounted(() => {
	game.value = new ColonyScene('game-container', {
		count,
		gameState,
	})
})

onUnmounted(() => {
	if (game.value) {
		game.value.destroy()
	}
})
</script>

<style scoped lang="css"></style>
