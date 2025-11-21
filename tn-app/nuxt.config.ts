// "@nuxtjs/apollo": "4.0.1-rc.5",
// '@nuxtjs/apollo'
// @nuxt/ui adds @nuxtjs/tailwindcss and @nuxt/icon automatically

export default defineNuxtConfig({
	ssr: false, //! DISABLED FOR DEV, ENABLE FOR PROD
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },
	devServer: {
		port: 37090,
	},
	app: {
		pageTransition: { name: 'page', mode: 'out-in' },
	},
	modules: ['@nuxt/ui', '@vueuse/nuxt', '@pinia/nuxt'],
	css: ['~/assets/css/main.css'],
	runtimeConfig: {
		public: {
			//apiUrl: process.env.API_URL || 'http://localhost:37000/graphql',
		},
	},
	icon: {
		provider: 'iconify',
		collections: ['lucide'],
	},
	router: {
		options: {
			scrollBehaviorType: 'smooth',
		},
	},
	vite: {
		plugins: [require('@rollup/plugin-graphql')()],
	},
})
