import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
	state: () => ({
		notifications: [] as Array<{
			id: string
			message: string
			type: 'info' | 'error' | 'success'
		}>,
		showDebug: false,
		ecsEditorOpen: false,
	}),

	actions: {
		addNotification(
			message: string,
			type: 'info' | 'error' | 'success' = 'info'
		) {
			const id = Math.random().toString(36).substr(2, 9)
			this.notifications.push({ id, message, type })
			setTimeout(() => {
				this.notifications = this.notifications.filter((n) => n.id !== id)
			}, 4000)
		},

		toggleDebug() {
			this.showDebug = !this.showDebug
		},

		toggleEcsEditor() {
			this.ecsEditorOpen = !this.ecsEditorOpen
		},
	},
})
