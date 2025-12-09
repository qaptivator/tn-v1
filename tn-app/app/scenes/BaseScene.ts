// a scene is any distinct renderer or view in the game
// examples of scenes: colony views with phaser, globe view with threejs/mapbox, 3d building preview with threejs, etc.
export default abstract class BaseScene {
	abstract game: any
	abstract scene?: any
	//static create(parent: HTMLElement | string): void
	constructor(parent: HTMLElement | string) {}
	abstract destroy(): void
	abstract resize(): void
	//update(): void
}
