import Phaser from 'phaser'
import { seed } from '../noise'
import type { Entity } from '~/store/ecs'
import type { ColonySceneState } from './types'
import { TILE_WIDTH, TILE_HEIGHT, COLORS, type IsometricTile } from './types'
import { setupCamera } from './camera'
import { generateTileGrid, renderTerrain } from './terrain'
import { setupInput, setupUIDetection } from './input'
import { syncFromStore } from './entities'
import {
	updateBuildingPreview,
	hideBuildingPreview,
	drawMovementRange,
	updateMovementPreview,
	hideMovementPreview,
} from './previews'
import { highlightEntity, clearHighlight } from './selection'
import { qrToScreen, screenToQr } from './coordinates'
import { setupEventListeners } from './events'

export class MainScene extends Phaser.Scene {
	private tiles: IsometricTile[] = []
	private terrainLayer!: Phaser.GameObjects.Container
	private objectsContainer!: Phaser.GameObjects.Container
	private movementRangeGraphics!: Phaser.GameObjects.Graphics
	private movementArrowGraphics!: Phaser.GameObjects.Graphics
	private cursorGraphics!: Phaser.GameObjects.Graphics
	private buildingPreviewSpriteRef = {
		value: null as Phaser.GameObjects.Image | null,
	}
	private movingGhostSpriteRef = {
		value: null as Phaser.GameObjects.Image | null,
	}

	hoveredPos!: { q: number; r: number } | undefined
	isPointerOverUI!: boolean
	state!: ColonySceneState

	constructor() {
		super({ key: 'MainScene' })
	}

	preload() {
		for (const asset of this.state.assetsStore.assets) {
			this.load.image(
				asset.path,
				this.state.assetsStore.getAssetUrl(asset.path).full
			)
		}
	}

	create() {
		seed(Math.random() * 10000) // Setup
		setupCamera(this)
		this.terrainLayer = this.add.container(0, 0)
		this.objectsContainer = this.add.container(0, 0)
		this.tiles = generateTileGrid(24, 24)
		this.terrainLayer = renderTerrain(this, this.tiles)
		this.cursorGraphics = this.add.graphics({ x: 0, y: 0 })
		this.movementRangeGraphics = this.add.graphics({ x: 0, y: 0 })
		this.movementArrowGraphics = this.add.graphics({ x: 0, y: 0 })

		this.terrainLayer.setDepth(0)
		this.objectsContainer.setDepth(100)

		// Setup UI detection
		setupUIDetection(this)

		// Setup input
		setupInput(
			this,
			this.state,
			this.cursorGraphics,
			(pos) => this.handlePointerMove(pos),
			(pos) => this.handlePointerDown(pos),
			() => this.shouldSnapToGrid(),
			() => this.clearHighlight(),
			(id) => this.state.gameStore.selectEntity(id)
		)

		// Setup store event listeners
		setupEventListeners(this, this.state)

		// Initial sync
		this.syncFromStore()

		/*const testSprite = this.add.image(100, 100, 'factory')
		testSprite.setScale(0.5)
		// this makes it disappear
		this.objectsContainer.add(testSprite)*/
	}

	private shouldSnapToGrid(): boolean {
		// Check if placing building
		if (
			this.state.gameStore.mode === 'building' &&
			this.state.gameStore.buildingDraft
		) {
			const snapC = this.state.ecsStore.tryGetComponent(
				this.state.gameStore.buildingDraft.prefab,
				'WorldC'
			)
			return snapC?.snap ?? true
		}

		// Check if moving entity
		if (
			this.state.gameStore.mode === 'moving' &&
			this.state.gameStore.movingEntityId
		) {
			const entity = this.state.ecsStore.getEntityById(
				this.state.gameStore.movingEntityId
			)
			if (entity) {
				const snapC = this.state.ecsStore.tryGetComponent(
					entity.prefab,
					'WorldC'
				)
				return snapC?.snap ?? true
			}
		}

		return true
	}

	private handlePointerMove(pos: { q: number; r: number }) {
		this.state.gameStore.updateHoveredPos(pos)
		this.hoveredPos = pos

		// Update preview based on mode
		if (this.state.gameStore.mode === 'building') {
			this.updateBuildingPreview(this.state.gameStore.buildingDraft, pos)
		} else if (this.state.gameStore.mode === 'moving') {
			this.updateMovementPreview(this.state.gameStore.movingEntityId, pos)
		}
	}

	private handlePointerDown(pos: { q: number; r: number }) {
		if (this.state.gameStore.mode === 'building') {
			this.state.gameStore.updatePlacementPosition(pos)
			this.state.gameStore.confirmPlacement()
		} else if (this.state.gameStore.mode === 'moving') {
			this.state.gameStore.confirmMovement(pos)
		}
	}

	// === Public methods for external calls ===

	syncFromStore() {
		syncFromStore(this, this.state, this.objectsContainer)
	}

	showBuildingPreview(draft: any) {
		if (!draft) return
		this.updateBuildingPreview(draft, this.state.gameStore.draftPosition)
	}

	updateBuildingPreview(draft: any, pos: any) {
		updateBuildingPreview(
			this,
			this.state,
			draft,
			pos,
			this.buildingPreviewSpriteRef
		)
	}

	hideBuildingPreview() {
		hideBuildingPreview(this, this.buildingPreviewSpriteRef)
	}

	startMovementMode(entityId: string) {
		const entity = this.state.ecsStore.getEntityById(entityId)
		if (!entity) return
		drawMovementRange(this, this.state, entity, this.movementRangeGraphics)
	}

	updateMovementPreview(entityId: string | undefined, targetPos: any) {
		updateMovementPreview(
			this,
			this.state,
			entityId,
			targetPos,
			this.movingGhostSpriteRef,
			this.movementArrowGraphics
		)
	}

	hideMovementMode() {
		hideMovementPreview(this.movingGhostSpriteRef, this.movementArrowGraphics)
		this.movementRangeGraphics.clear()
	}

	highlightEntity(entityId: string) {
		highlightEntity(this, this.objectsContainer, entityId)
	}

	clearHighlight() {
		clearHighlight(this, this.objectsContainer)
	}
}
