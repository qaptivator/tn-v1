// a scene is any distinct renderer or view in the game
// examples of scenes: colony views with phaser, globe view with threejs/mapbox, 3d building preview with threejs, etc.
export default interface BaseScene {
	game: any
	scene?: any
	create(): void
	destroy(): void
	resize(): void
	//update(): void
}
