<template>
	<div>
		<!--<div
			id="globe-container"
			class="w-full h-full"
		></div>-->
		<!--<div class="fixed top-4 left-4 text-white text-sm z-10 pointer-events-none">
			<p>Zoom: {{ zoomLevel.toFixed(2) }}</p>
			<p
				v-if="isGridViewThreshold"
				class="text-cyan-400"
			>
				Switching to grid view...
			</p>
		</div>-->
	</div>
</template>

<script setup lang="js">
import * as THREE from 'three/webgpu'
import {
	step,
	normalWorldGeometry,
	output,
	texture,
	vec3,
	vec4,
	normalize,
	positionWorld,
	bumpMap,
	cameraPosition,
	color,
	uniform,
	mix,
	uv,
	max,
} from 'three/tsl'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Inspector } from 'three/addons/inspector/Inspector.js'
import { useGameStore } from '~/store/game'

definePageMeta({
	layout: 'blank',
})

const router = useRouter()
const gameStore = useGameStore()

/*let camera: THREE.PerspectiveCamera
let scene: THREE.Scene
let renderer: THREE.WebGPURenderer
let controls: OrbitControls
let globe: THREE.Mesh
let atmosphere: THREE.Mesh
let skybox: THREE.Mesh
let clock: THREE.Clock
let animationId: number*/

let camera
let scene
let renderer
let controls
let globe
let atmosphere
let skybox
let clock
let animationId

const zoomLevel = ref(3)
const isGridViewThreshold = ref(false)
const ZOOM_THRESHOLD = 1.1 // When camera distance is less than this, switch to grid
const MIN_ZOOM = 1.1
const MAX_ZOOM = 50

onMounted(() => {
	init()
})

onUnmounted(() => {
	destroy()
})

function init() {
	clock = new THREE.Clock()

	camera = new THREE.PerspectiveCamera(
		25,
		window.innerWidth / window.innerHeight,
		0.1,
		200
	)
	camera.position.set(3, 1, -3)
	camera.lookAt(0, 0, 0)
	if (gameStore.globeCameraTransform) {
		camera.position.copy(gameStore.globeCameraTransform.position).multiplyScalar(1.1)
		camera.quaternion.copy(gameStore.globeCameraTransform.quaternion)
	}

	scene = new THREE.Scene()
	const GLOBE_POS = [0, 0, 0]

	const test = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.BackSide })
	)
	test.position.set(0, 0, 0)
	scene.add(test)

	// sun
	const sun = new THREE.DirectionalLight('#ffffff', 2)
	sun.position.set(1, 0.5, 2)
	scene.add(sun)

	// uniforms
	const atmosphereDayColor = uniform(color('#4db2ff'))
	const atmosphereTwilightColor = atmosphereDayColor
	const roughnessLow = uniform(0.25)
	const roughnessHigh = uniform(0.35)

	// textures
	const textureLoader = new THREE.TextureLoader()

	const dayTexture = textureLoader.load('./textures/planets/earth_day_4096.jpg')
	dayTexture.colorSpace = THREE.SRGBColorSpace
	dayTexture.anisotropy = 8

	const nightTexture = textureLoader.load(
		'./textures/planets/earth_night_4096.jpg'
	)
	nightTexture.colorSpace = THREE.SRGBColorSpace
	nightTexture.anisotropy = 8

	const bumpRoughnessCloudsTexture = textureLoader.load(
		'./textures/planets/earth_bump_roughness_clouds_4096.jpg'
	)
	bumpRoughnessCloudsTexture.anisotropy = 8

	// fresnel
	const viewDirection = positionWorld.sub(cameraPosition).normalize()
	const fresnel = viewDirection
		.dot(normalWorldGeometry)
		.abs()
		.oneMinus()
		.toVar()

	// sun orientation
	const sunOrientation = normalWorldGeometry
		.dot(normalize(sun.position))
		.toVar()

	// atmosphere color
	const atmosphereColor = mix(
		atmosphereTwilightColor,
		atmosphereDayColor,
		sunOrientation.smoothstep(-0.25, 0.75)
	)

	// stellar skybox
	const starTexture = textureLoader.load('./textures/planets/8k_stars.jpg')
	starTexture.colorSpace = THREE.SRGBColorSpace

	const skyboxMaterial = new THREE.MeshBasicNodeMaterial()
	skyboxMaterial.colorNode = texture(starTexture)
	skyboxMaterial.opacityNode = uniform(0.5)
	skyboxMaterial.side = THREE.BackSide

	const skyboxGeometry = new THREE.SphereGeometry(180, 64, 64)
	skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial)
	skybox.rotation.set(0, Math.random() * Math.PI * 2, 0)
	scene.add(skybox)

	// globe
	const globeMaterial = new THREE.MeshStandardNodeMaterial()

	const cloudsStrength = texture(
		bumpRoughnessCloudsTexture,
		uv()
	)
		.b.smoothstep(0.2, 1)

	globeMaterial.colorNode = mix(
		texture(dayTexture),
		vec3(1),
		cloudsStrength.mul(2)
	)

	const roughness = max(
		texture(bumpRoughnessCloudsTexture).g,
		step(0.01, cloudsStrength)
	)
	globeMaterial.roughnessNode = roughness.remap(
		0,
		1,
		roughnessLow,
		roughnessHigh
	)

	const night = texture(nightTexture)
	const dayStrength = sunOrientation.smoothstep(-0.25, 0.5)

	const atmosphereDayStrength = sunOrientation.smoothstep(-0.5, 1)
	const atmosphereMix = atmosphereDayStrength
		.mul(fresnel.pow(2))
		.clamp(0, 1)

	let finalOutput = mix(night.rgb, output.rgb, dayStrength)
	finalOutput = mix(finalOutput, atmosphereColor, atmosphereMix)

	globeMaterial.outputNode = vec4(finalOutput, output.a)

	const bumpElevation = max(
		texture(bumpRoughnessCloudsTexture).r,
		cloudsStrength
	)
	globeMaterial.normalNode = bumpMap(bumpElevation)

	const sphereGeometry = new THREE.SphereGeometry(1, 64, 64)
	globe = new THREE.Mesh(sphereGeometry, globeMaterial)
	globe.position.set(...(GLOBE_POS))
	scene.add(globe)

	// atmosphere
	const atmosphereMaterial = new THREE.MeshBasicNodeMaterial({
		side: THREE.BackSide,
		transparent: true,
	})
	let alpha = fresnel.remap(0.73, 1, 1, 0).pow(3)
	alpha = alpha.mul(sunOrientation.smoothstep(-0.5, 1))
	atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha)

	atmosphere = new THREE.Mesh(sphereGeometry, atmosphereMaterial)
	atmosphere.scale.setScalar(1.04)
	atmosphere.position.set(...(GLOBE_POS))
	scene.add(atmosphere)

	// renderer
	const container = document.getElementById('globe-container')
	//if (!container) return

	renderer = new THREE.WebGPURenderer()
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.setAnimationLoop(animate)
	document.body.appendChild(renderer.domElement)

	// controls
	controls = new OrbitControls(camera, renderer.domElement)
	controls.enablePan = true
	controls.enableRotate = true
	controls.enableZoom = true
	controls.enableDamping = true
	controls.dampingFactor = 0.05
	controls.minDistance = MIN_ZOOM
	controls.maxDistance = MAX_ZOOM
	controls.autoRotate = false

	// events
	window.addEventListener('resize', onWindowResize)
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

function checkZoomThreshold() {
	const distance = camera.position.length()
	zoomLevel.value = distance

	if (distance < ZOOM_THRESHOLD && !isGridViewThreshold.value) {
		isGridViewThreshold.value = true
		/*gameStore.globeCameraTransform = {
			position: camera.position.clone(),
			quaternion: camera.quaternion.clone(),
		}
		// Transition to grid view
		setTimeout(() => {
			destroy()
			router.push('/game')
		}, 500)*/
	}
}

function animate() {
	const delta = clock.getDelta()
	//globe.rotation.y += delta * 0.025
	skybox.rotation.y += delta * 0.001

	controls.update()
	checkZoomThreshold()

	renderer.render(scene, camera)
}

function destroy() {
	if (animationId) {
		cancelAnimationFrame(animationId)
	}

	if (renderer) {
		renderer.dispose()
		if (renderer.domElement && renderer.domElement.parentNode) {
			renderer.domElement.parentNode.removeChild(renderer.domElement)
		}
	}

	if (controls) {
		controls.dispose()
	}

	window.removeEventListener('resize', onWindowResize)
}
</script>

<style scoped></style>
