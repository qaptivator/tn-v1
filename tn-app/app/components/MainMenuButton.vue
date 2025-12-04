<template>
	<button
		@mouseover="hoverSoundPlay"
		@click="clickSoundPlay"
		:class="['btn', variantClass]"
		:disabled="disabled"
		:style="customStyles"
	>
		{{ label }}
	</button>
</template>

<script setup>
const props = defineProps({
	label: {
		type: String,
		default: 'Button',
	},
	variant: {
		type: String,
		enum: ['primary', 'secondary', 'accent'],
		default: 'primary',
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	padding: {
		type: String,
		default: '24px 48px',
	},
	width: {
		type: String,
		default: '280px',
	},
	fontSize: {
		type: String,
		default: '16px',
	},
	borderWidth: {
		type: String,
		default: '1px',
	},
	borderRightWidth: {
		type: String,
		default: '4px',
	},
	letterSpacing: {
		type: String,
		default: '1.2px',
	},
})

import _hoverSound from '~~/public/sounds/hover.wav'
import _clickSound from '~~/public/sounds/click.wav'

const hoverSound = useSound(_hoverSound, { volume: 0.3, interrupt: true })
const clickSound = useSound(_clickSound, { volume: 0.5 })

function hoverSoundPlay() {
	console.log('hoverSoundPlay')
	hoverSound.play()
}

function clickSoundPlay() {
	console.log('clickSoundPlay')
	clickSound.play()
}

const variantClass = computed(() => {
	return {
		'btn-secondary': props.variant === 'secondary',
		'btn-accent': props.variant === 'accent',
	}
})

const customStyles = computed(() => ({
	padding: props.padding,
	width: props.width,
	fontSize: props.fontSize,
	borderWidth: props.borderWidth,
	borderRightWidth: props.borderRightWidth,
	letterSpacing: props.letterSpacing,
}))
</script>

<style scoped>
/* Primary Button */
.btn {
	font-family: 'Inter', sans-serif;
	font-weight: 300;
	text-transform: uppercase;
	border: 1px solid #00d9ff;
	border-right: 4px solid #00d9ff;
	background: rgba(0, 217, 255, 0.1);
	/*background: transparent;*/
	color: #ffffff;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
	text-align: left;
	backdrop-filter: blur(10px);
}

.btn:hover:not(:disabled) {
	background: rgba(0, 217, 255, 0.2);
	box-shadow: 0 0 20px rgba(0, 217, 255, 0.3),
		inset 0 0 20px rgba(0, 217, 255, 0.05);
	letter-spacing: 1.5px;
	border-right-width: 6px;
}

.btn:active:not(:disabled) {
	transform: scale(0.98);
}

/* Secondary Button - Dark variant */
.btn-secondary {
	border-color: #aaaaaa;
	border-right: 4px solid #aaaaaa;
	color: #ffffff;
	background: rgba(170, 170, 170, 0.1);
}

.btn-secondary:hover:not(:disabled) {
	background: rgba(170, 170, 170, 0.2);
	box-shadow: 0 0 20px rgba(170, 170, 170, 0.2),
		inset 0 0 20px rgba(170, 170, 170, 0.03);
	border-right-width: 6px;
}

/* Accent Button - Red/Warning variant */
.btn-accent {
	border-color: #ff1744;
	border-right: 4px solid #ff1744;
	background: rgba(255, 23, 68, 0.1);
	color: #ffffff;
}

.btn-accent:hover:not(:disabled) {
	background: rgba(255, 23, 68, 0.2);
	box-shadow: 0 0 20px rgba(255, 23, 68, 0.3),
		inset 0 0 20px rgba(255, 23, 68, 0.05);
	border-right-width: 6px;
}

/* Disabled State */
.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	box-shadow: none;
}

.btn:disabled:hover {
	background: transparent;
	box-shadow: none;
}
</style>
