import Phaser from 'phaser'
import { BaseScene } from '../BaseScene'
import { MainScene } from './scene'
import type { ColonySceneState } from './types'

export class ColonyScene extends BaseScene {
	game!: Phaser.Game
	scene!: MainScene

	constructor(parent: HTMLElement | string, state: ColonySceneState) {
		super(parent, state)
		this.scene = new MainScene()
		this.scene.state = state
		const config: Phaser.Types.Core.GameConfig = {
			type: Phaser.AUTO,
			parent: parent,
			width: window.innerWidth,
			height: window.innerHeight,
			backgroundColor: '#1a1a1a',
			scene: this.scene,
			pixelArt: false,
		}
		this.game = new Phaser.Game(config)
	}

	destroy() {
		if (this.game.canvas.parentNode) {
			this.game.canvas.parentNode.removeEventListener(
				'pointerenter',
				null as any
			)
			this.game.canvas.parentNode.removeEventListener(
				'pointerleave',
				null as any
			)
		}
		this.game.destroy(true)
	}

	resize() {
		this.game.scale.resize(window.innerWidth, window.innerHeight)
	}
}
