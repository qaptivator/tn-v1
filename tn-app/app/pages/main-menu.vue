<template>
	<div>
		<MainMenuFade @done="playSong" />
		<div
			class="h-screen w-1/3 fixed top-0 left-0 z-10 p-16 flex justify-center items-center"
		>
			<div class="flex flex-col items-start">
				<h1
					class="font-extrabold text-7xl mb-10"
					style="font-family: 'Inter', sans-serif; font-weight: 300"
				>
					<span class="text-[#00d9ff]">Terra</span>nations
				</h1>
				<div class="flex flex-col text-5xl gap-4 w-full">
					<MainMenuButton
						label="Play"
						class="font-bold! w-full!"
					/>
					<MainMenuButton
						label="Settings"
						variant="secondary"
					/>
					<MainMenuButton
						label="Credits"
						variant="secondary"
					/>
					<MainMenuButton
						label="Quit"
						variant="accent"
					/>
				</div>
				<div class="flex gap-2 mt-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						x="0px"
						y="0px"
						width="32"
						height="32"
						viewBox="0 0 50 50"
					>
						<path
							fill="#FFFFFF"
							d="M42.298,11.65c-0.676-1.021-1.633-1.802-2.768-2.256c-2.464-0.988-4.583-1.648-6.479-2.02	C31.721,7.114,30.404,7.768,29.771,9l-0.158,0.308c-1.404-0.155-2.895-0.207-4.593-0.164c-1.741-0.042-3.237,0.009-4.643,0.164	L20.22,9c-0.633-1.232-1.952-1.885-3.279-1.625c-1.896,0.371-4.016,1.031-6.479,2.02c-1.134,0.454-2.091,1.234-2.768,2.256	c-4.721,7.131-6.571,14.823-5.655,23.517c0.032,0.305,0.202,0.578,0.461,0.741c3.632,2.29,6.775,3.858,9.891,4.936	c1.303,0.455,2.748-0.054,3.517-1.229l1.371-2.101c-1.092-0.412-2.158-0.9-3.18-1.483c-0.479-0.273-0.646-0.884-0.373-1.363	c0.273-0.481,0.884-0.65,1.364-0.373c3.041,1.734,6.479,2.651,9.942,2.651s6.901-0.917,9.942-2.651	c0.479-0.277,1.09-0.108,1.364,0.373c0.273,0.479,0.106,1.09-0.373,1.363c-1.056,0.603-2.16,1.105-3.291,1.524l1.411,2.102	c0.581,0.865,1.54,1.357,2.528,1.357c0.322,0,0.647-0.053,0.963-0.161c3.125-1.079,6.274-2.649,9.914-4.944	c0.259-0.163,0.429-0.437,0.461-0.741C48.869,26.474,47.019,18.781,42.298,11.65z M18.608,28.983c-1.926,0-3.511-2.029-3.511-4.495	c0-2.466,1.585-4.495,3.511-4.495s3.511,2.029,3.511,4.495C22.119,26.954,20.534,28.983,18.608,28.983z M31.601,28.957	c-1.908,0-3.478-2.041-3.478-4.522s1.57-4.522,3.478-4.522c1.908,0,3.478,2.041,3.478,4.522S33.509,28.957,31.601,28.957z"
						></path>
					</svg>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						x="0px"
						y="0px"
						width="32"
						height="32"
						viewBox="0 0 50 50"
					>
						<path
							fill="#FFFFFF"
							d="M 44.898438 14.5 C 44.5 12.300781 42.601563 10.699219 40.398438 10.199219 C 37.101563 9.5 31 9 24.398438 9 C 17.800781 9 11.601563 9.5 8.300781 10.199219 C 6.101563 10.699219 4.199219 12.199219 3.800781 14.5 C 3.398438 17 3 20.5 3 25 C 3 29.5 3.398438 33 3.898438 35.5 C 4.300781 37.699219 6.199219 39.300781 8.398438 39.800781 C 11.898438 40.5 17.898438 41 24.5 41 C 31.101563 41 37.101563 40.5 40.601563 39.800781 C 42.800781 39.300781 44.699219 37.800781 45.101563 35.5 C 45.5 33 46 29.398438 46.101563 25 C 45.898438 20.5 45.398438 17 44.898438 14.5 Z M 19 32 L 19 18 L 31.199219 25 Z"
						></path>
					</svg>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						x="0px"
						y="0px"
						width="32"
						height="32"
						viewBox="0 0 50 50"
					>
						<path
							fill="#FFFFFF"
							d="M 6.9199219 6 L 21.136719 26.726562 L 6.2285156 44 L 9.40625 44 L 22.544922 28.777344 L 32.986328 44 L 43 44 L 28.123047 22.3125 L 42.203125 6 L 39.027344 6 L 26.716797 20.261719 L 16.933594 6 L 6.9199219 6 z"
						></path>
					</svg>
					<p class="text-xs select-none text-white/50">v1.4.2</p>
				</div>
			</div>
		</div>
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

import mainMenuSong from '~~/public/sounds/main_menu.mp3'


let camera, scene, renderer, controls, globe, clock, skybox

init()
const mainMenuSound = useSound(mainMenuSong, { volume: 0.5, onend: () => {mainMenuSound.play()} })

function playSong() {
    // { volume: 0.5, onend: () => {mainMenuSound.play()} }
    mainMenuSound.play({
        loop: true,
        volume: 0.5,
    })
}

function init() {
	clock = new THREE.Clock()

	camera = new THREE.PerspectiveCamera(
		25, // 25
		window.innerWidth / window.innerHeight,
		0.1,
		200
	)
	camera.position.set(3, 1, -3)
    camera.lookAt(0, 0, 2)
	//camera.rotation.set(-Math.PI / 4, 0, 0)

    const cameraRotationX = uniform(0);
    const cameraPositionX = uniform(0);

	scene = new THREE.Scene()
	const GLOBE_POS = [0, 0, 0]

	const test = new THREE.Mesh(
		new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.BackSide })
	)
	test.position.set(0, 0, 0) // 4.5, 2, 3
	scene.add(test)

    /*const wireframeGeometry = new THREE.PlaneGeometry(10, 10, 50, 50)
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
    })
    const wireframePlane = new THREE.Mesh(wireframeGeometry, wireframeMaterial)
    wireframePlane.position.set(0, 0, 0)
    wireframePlane.rotation.x = -Math.PI / 2
    scene.add(wireframePlane)*/

	// sun

	const sun = new THREE.DirectionalLight('#ffffff', 2)
	sun.position.set(1, 0.5, 2)
	scene.add(sun)

	// uniforms

	const atmosphereDayColor = uniform(color('#4db2ff'))
	//const atmosphereTwilightColor = uniform(color('#bc490b'))
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
    skybox.rotation.set(
        0,
        Math.random() * Math.PI * 2,
        0
    )
    scene.add(skybox)

    //#region sun mesh (glowing ball)
    const falloffAmount = uniform(0.1)
    const glowInternalRadius = uniform(6.0)
    const glowColor_ = uniform(color('#fffff0'))
    const glowSharpness = uniform(0.1)
    const opacityUniform = uniform(0.7)

    const sunMaterial = new THREE.MeshStandardNodeMaterial()
    sunMaterial.transparent = true
    sunMaterial.blending = THREE.AdditiveBlending
    sunMaterial.depthWrite = false
    sunMaterial.side = THREE.DoubleSide

    const normal = normalWorldGeometry
    const viewDirection2 = normalize(positionWorld.sub(cameraPosition))
    const fresnel2 = viewDirection2.dot(normal).pow(glowInternalRadius.add(0.1))
    const falloff = fresnel2.smoothstep(0, falloffAmount)
    const fakeGlow = fresnel2.add(fresnel2.mul(glowSharpness)).mul(falloff)

    sunMaterial.outputNode = vec4(
        glowColor_.mul(fresnel2).clamp(0, 1),
        fakeGlow.clamp(0, opacityUniform)
    )

    const sunGeometry = new THREE.SphereGeometry(4, 32, 32)
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial)
    sunMesh.position.set(2.5, 0, 3)
    //scene.add(sunMesh)

    // inner core
    /*const emissiveMaterial = new THREE.MeshStandardNodeMaterial()
    emissiveMaterial.colorNode = color('#ffff00')
    emissiveMaterial.emissiveNode = color('#ffff00').mul(2)

    const emissiveGeometry = new THREE.SphereGeometry(0.2, 16, 16)
    const emissiveMesh = new THREE.Mesh(emissiveGeometry, emissiveMaterial)
    emissiveMesh.position.set(0, 0, 3)
    scene.add(emissiveMesh)*/
    //#endregion

	//#region globe

	const globeMaterial = new THREE.MeshStandardNodeMaterial()

	const cloudsStrength = texture(bumpRoughnessCloudsTexture, uv()).b.smoothstep(
		0.2,
		1
	)

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
	const atmosphereMix = atmosphereDayStrength.mul(fresnel.pow(2)).clamp(0, 1)

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
	globe.position.set(...GLOBE_POS)
	scene.add(globe)

    //#endregion

	//#region atmosphere

	const atmosphereMaterial = new THREE.MeshBasicNodeMaterial({
		side: THREE.BackSide,
		transparent: true,
	})
	let alpha = fresnel.remap(0.73, 1, 1, 0).pow(3)
	alpha = alpha.mul(sunOrientation.smoothstep(-0.5, 1))
	atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha)

	const atmosphere = new THREE.Mesh(sphereGeometry, atmosphereMaterial)
	atmosphere.scale.setScalar(1.04)
	atmosphere.position.set(...GLOBE_POS)
	scene.add(atmosphere)

    //#endregion

	// renderer

	renderer = new THREE.WebGPURenderer()
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.setAnimationLoop(animate)
	renderer.inspector = new Inspector()
	document.body.appendChild(renderer.domElement)

	// controls

	/*controls = new OrbitControls(camera, renderer.domElement)
	controls.enablePan = false
	controls.enableRotate = false
    controls.enableZoom = false
	controls.enableDamping = true
	controls.minDistance = 0.1
	controls.maxDistance = 50*/

	// events

	window.addEventListener('resize', onWindowResize)

	//#region debug (gui)

	const gui = renderer.inspector.createParameters('Parameters')

	gui
		.addColor(
			{
				color: atmosphereDayColor.value.getHex(THREE.SRGBColorSpace),
			},
			'color'
		)
		.onChange((value) => {
			atmosphereDayColor.value.set(value)
		})
		.name('atmosphereDayColor')

	gui
		.addColor(
			{
				color: atmosphereTwilightColor.value.getHex(THREE.SRGBColorSpace),
			},
			'color'
		)
		.onChange((value) => {
			atmosphereTwilightColor.value.set(value)
		})
		.name('atmosphereTwilightColor')

	gui.add(roughnessLow, 'value', 0, 1, 0.001).name('roughnessLow')
	gui.add(roughnessHigh, 'value', 0, 1, 0.001).name('roughnessHigh')

    gui.add( cameraRotationX, 'value', -Math.PI, Math.PI, 0.01 )
        .onChange( ( value ) => {
            camera.rotation.x = value;
            camera.updateProjectionMatrix(); // Not strictly needed for rotation, but good practice
        } )
        .name( 'cameraRotationX' );

        gui.add( cameraPositionX, 'value', -10, 10, 0.01 )
        .onChange( ( value ) => {
            camera.position.x = value;
            camera.updateProjectionMatrix(); // Not strictly needed for rotation, but good practice
        } )
        .name( 'cameraPositionX' );

    //#endregion
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()

	renderer.setSize(window.innerWidth, window.innerHeight)
}

async function animate() {
	const delta = clock.getDelta()
	globe.rotation.y += delta * 0.025
    skybox.rotation.y += delta * 0.001
	//controls.update()
	renderer.render(scene, camera)
}
</script>
<style scoped lang="css"></style>
