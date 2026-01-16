import Phaser from 'phaser'
import { MIN_ZOOM, MAX_ZOOM } from './types'

export function setupCamera(scene: Phaser.Scene) {
	const cam = scene.cameras.main
	cam.centerOn(0, 0)
	cam.setZoom(1.2)

	scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
		if (!p.isDown) return
		cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom
		cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom
	})

	// Uncomment when needed
	/*scene.input.on(
        'wheel',
        (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const newZoom = Phaser.Math.Clamp(
                cam.zoom - deltaY * 0.001,
                MIN_ZOOM,
                MAX_ZOOM
            )
            cam.setZoom(newZoom)
        }
    )*/
}
