export default interface BaseScene {
	create(): void
	destroy(): void
	update(): void
	resize(): void
}
