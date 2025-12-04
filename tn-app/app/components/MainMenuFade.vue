<template>
	<div
		ref="overlay"
		class="w-screen h-screen bg-black z-40 cursor-pointer fixed top-0 left-0 flex items-center justify-center text-4xl text-white font-mono"
		@click="fadeOut"
	>
		{{ overlayText }}
	</div>
</template>
<script setup lang="js">
// https://github.com/vueuse/sound#nuxt
const emit = defineEmits(['done'])
const overlay = ref(null)
const overlayClicked = ref(false)
const overlayText = ref('< tap to begin >')
import _typewriterSound from '~~/public/sounds/typewriter.wav'
const typewriterSound = useSound(_typewriterSound, { volume: 0.2 })
function fadeOut() {
	if (overlay.value && !overlayClicked.value) {
        overlayClicked.value = true
        const interval = setInterval(() => {
            if (overlayText.value.length > 0) {
                overlayText.value = overlayText.value.slice(0, -1);
                //if (overlayText.value.length % 2 === 0) typewriterSound.play()
                typewriterSound.play()
            } else {
                clearInterval(interval);
            }
        }, 60);
        setTimeout(() => {
            overlay.value.classList.add(
                'opacity-0',
                'transition-opacity',
                'duration-5000',
                'pointer-events-none'
            )
            emit('done')
            setTimeout(() => {
                overlay.value.remove();
            }, 5000);
        }, 1000);
	}
}
</script>
<style scoped lang="css"></style>
