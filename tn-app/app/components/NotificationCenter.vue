<template>
	<div class="fixed top-4 right-4 space-y-2 pointer-events-none">
		<TransitionGroup name="slide">
			<UAlert
				v-for="notification in notifications"
				:key="notification.id"
				:title="notification.message"
				:color="
					notification.type === 'error'
						? 'red'
						: notification.type === 'success'
						? 'green'
						: 'blue'
				"
				:ui="{ container: 'pointer-events-auto' }"
				class="max-w-xs"
			/>
		</TransitionGroup>
	</div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/store/ui'

const uiStore = useUiStore()
const notifications = computed(() => uiStore.notifications)
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
	transition: all 0.3s ease;
}

.slide-enter-from {
	transform: translateX(100%);
	opacity: 0;
}

.slide-leave-to {
	transform: translateX(100%);
	opacity: 0;
}
</style>
