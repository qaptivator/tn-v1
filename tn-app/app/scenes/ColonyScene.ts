import Phaser from 'phaser'
import type BaseScene from './BaseScene'

// Constants
const TILE_W = 64
const TILE_H = 32
const GRID_SIZE = 8
const MAX_TURNS = 5

const COLORS = {
	highlight: 0xffff00,
	move: 0x44ff44,
	attack: 0xff4444,
	enemy: 0x994499,
	mech: 0x4499cc,
	building: 0xeeeeee,
	mountain: 0x654321,
	ground: 0x333333,
	water: 0x224488,
}

const DIRS = [
	{ x: 0, y: -1 },
	{ x: 1, y: 0 },
	{ x: 0, y: 1 },
	{ x: -1, y: 0 },
]

// use refs here
// Game State
//let game: Phaser.Game

// Unit Class
class Unit {
	scene: MainScene
	type: string
	gridX: number
	gridY: number
	isPlayer: boolean
	maxHp: number
	hp: number
	moved: boolean
	acted: boolean
	dead: boolean
	originalX: number
	originalY: number
	container: Phaser.GameObjects.Container
	sprite: Phaser.GameObjects.Graphics
	hpBar: Phaser.GameObjects.Graphics
	intentIcon: Phaser.GameObjects.Graphics
	intent: any
	actionIndicator: Phaser.GameObjects.Graphics
	moveIndicator: Phaser.GameObjects.Graphics

	constructor(
		scene: MainScene,
		type: string,
		x: number,
		y: number,
		isPlayer: boolean
	) {
		this.scene = scene
		this.type = type
		this.gridX = x
		this.gridY = y
		this.isPlayer = isPlayer
		this.maxHp = isPlayer ? 3 : 2
		this.hp = this.maxHp
		this.moved = false
		this.acted = false
		this.dead = false
		this.originalX = x
		this.originalY = y

		this.container = scene.add.container(0, 0)
		this.container.setDepth(this.getDepth())

		this.sprite = scene.add.graphics()
		this.drawUnit()
		this.container.add(this.sprite)

		this.hpBar = scene.add.graphics()
		this.container.add(this.hpBar)
		this.updateHpBar()

		this.intentIcon = scene.add.graphics()
		this.intentIcon.visible = false
		this.container.add(this.intentIcon)
		this.intent = null

		this.actionIndicator = scene.add.graphics()
		this.moveIndicator = scene.add.graphics()
		this.container.add(this.actionIndicator)
		this.container.add(this.moveIndicator)
		this.updateIndicators()

		this.updatePosition(x, y)
	}

	getDepth(): number {
		return this.gridY * GRID_SIZE + this.gridX + 2
	}

	updatePosition(x: number, y: number, animate = false): void {
		this.gridX = x
		this.gridY = y
		const screenPos = this.scene.gridToScreen(x, y)
		const targetY = screenPos.y + TILE_H - 15

		if (animate) {
			this.scene.tweens.add({
				targets: this.container,
				x: screenPos.x,
				y: targetY,
				duration: 200,
				onComplete: () => {
					this.container.setDepth(this.getDepth())
				},
			})
		} else {
			this.container.setPosition(screenPos.x, targetY)
			this.container.setDepth(this.getDepth())
		}
	}

	drawUnit(): void {
		this.sprite.clear()
		const c = this.isPlayer ? COLORS.mech : COLORS.enemy
		const w = this.isPlayer ? 20 : 18
		const h = this.isPlayer ? 30 : 15
		this.drawIsoCube(c, w, h)
	}

	drawIsoCube(color: number, w: number, h: number): void {
		const g = this.sprite
		g.fillStyle(color)

		// Top Face
		g.beginPath()
		g.moveTo(0, -h)
		g.lineTo(w, -h + w / 2)
		g.lineTo(0, -h + w)
		g.lineTo(-w, -h + w / 2)
		g.closePath()
		g.fill()

		// Right Face
		g.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(20).color)
		g.beginPath()
		g.moveTo(w, -h + w / 2)
		g.lineTo(w, w / 2)
		g.lineTo(0, w)
		g.lineTo(0, -h + w)
		g.closePath()
		g.fill()

		// Left Face
		g.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(40).color)
		g.beginPath()
		g.moveTo(-w, -h + w / 2)
		g.lineTo(-w, w / 2)
		g.lineTo(0, w)
		g.lineTo(0, -h + w)
		g.closePath()
		g.fill()
	}

	updateHpBar(): void {
		this.hpBar.clear()
		if (this.dead) return

		const w = 30
		const h = 4
		const x = -15
		const y = -50

		this.hpBar.fillStyle(0x000000)
		this.hpBar.fillRect(x, y, w, h)

		const hpPct = this.hp / this.maxHp
		this.hpBar.fillStyle(hpPct > 0.5 ? 0x00ff00 : 0xff0000)
		this.hpBar.fillRect(x + 1, y + 1, (w - 2) * hpPct, h - 2)
	}

	takeDamage(amount: number): void {
		this.hp -= amount
		this.updateHpBar()

		this.scene.tweens.add({
			targets: this.sprite,
			alpha: 0,
			duration: 50,
			yoyo: true,
			repeat: 1,
		})

		if (this.hp <= 0) {
			this.dead = true
			this.scene.tweens.add({
				targets: this.container,
				alpha: 0,
				scale: 0,
				duration: 300,
				onComplete: () => {
					this.container.visible = false
				},
			})
		}
	}

	setIntent(intent: any): void {
		this.intent = intent
		this.intentIcon.visible = true
		this.intentIcon.clear()
		this.intentIcon.fillStyle(0xffcc00)
		this.intentIcon.fillCircle(0, -60, 5)
	}

	updateIndicators(): void {
		if (!this.isPlayer) return

		this.actionIndicator.clear()
		this.moveIndicator.clear()

		const indicatorY = -65
		const canAct = !this.acted

		if (canAct) {
			this.actionIndicator.fillStyle(0x44ff44)
			this.actionIndicator.beginPath()
			this.actionIndicator.moveTo(-6, indicatorY + 10)
			this.actionIndicator.lineTo(6, indicatorY + 10)
			this.actionIndicator.lineTo(0, indicatorY + 2)
			this.actionIndicator.closePath()
			this.actionIndicator.fill()

			if (!this.moved) {
				this.moveIndicator.fillStyle(0xffffff)
				this.moveIndicator.fillCircle(0, indicatorY - 3, 4)
			}
		}
	}
}

// Main Scene
class MainScene extends Phaser.Scene {
	grid: any[] = []
	units: Unit[] = []
	turn: number = 1
	powerGrid: number = 7
	maxPowerGrid: number = 7
	playerTurn: boolean = true
	selectedUnit: Unit | null = null
	actionMode: boolean = false
	gameOver: boolean = false

	enemyIntentGraphics!: Phaser.GameObjects.Graphics
	playerActionGraphics!: Phaser.GameObjects.Graphics
	cursorGraphics!: Phaser.GameObjects.Graphics

	constructor() {
		super({ key: 'MainScene' })
	}

	create(): void {
		this.enemyIntentGraphics = this.add.graphics()
		this.enemyIntentGraphics.setDepth(2000)

		this.playerActionGraphics = this.add.graphics()
		this.playerActionGraphics.setDepth(2001)

		this.cursorGraphics = this.add.graphics()
		this.cursorGraphics.setDepth(2002)

		this.input.on('pointerdown', this.handleInput, this)
		this.input.keyboard?.on('keydown-Q', () => this.deselect())
		this.input.keyboard?.on('keydown-E', () => this.enterAttackMode())

		this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
			if (pointer.rightButtonDown()) {
				this.deselect()
			}
		})

		this.input?.mouse?.disableContextMenu()

		this.cameras.main.zoom = 1
		this.cameras.main.scrollX = -window.innerWidth / 2
		this.cameras.main.scrollY = -200

		this.createGrid()
		this.spawnUnits()
		this.updateUI()
	}

	override update(): void {
		const pointer = this.input.activePointer
		const gridPos = this.screenToGrid(pointer.worldX, pointer.worldY)

		this.cursorGraphics.clear()

		if (this.isValidGrid(gridPos.x, gridPos.y)) {
			const screen = this.gridToScreen(gridPos.x, gridPos.y)
			this.cursorGraphics.lineStyle(2, 0xffffff, 0.5)
			this.drawIsoTile(this.cursorGraphics, screen.x, screen.y, 0, false)
		}
	}

	createGrid(): void {
		const buildingChance = 0.15
		const mountainChance = 0.1
		const waterChance = 0.05

		for (let y = 0; y < GRID_SIZE; y++) {
			this.grid[y] = []
			for (let x = 0; x < GRID_SIZE; x++) {
				let type = 'ground'
				const rnd = Math.random()
				const distToCenter = Math.abs(x - 3.5) + Math.abs(y - 3.5)

				if (distToCenter > 2) {
					if (rnd < waterChance) type = 'water'
					else if (rnd < waterChance + mountainChance) type = 'mountain'
					else if (rnd < waterChance + mountainChance + buildingChance)
						type = 'building'
				}

				this.grid[y][x] = {
					x,
					y,
					type,
					sprite: this.add.graphics(),
					highlight: false,
				}

				this.drawTile(x, y)
			}
		}
	}

	gridToScreen(x: number, y: number): { x: number; y: number } {
		const isoX = (x - y) * TILE_W
		const isoY = (x + y) * TILE_H
		return { x: isoX, y: isoY }
	}

	screenToGrid(sx: number, sy: number): { x: number; y: number } {
		const adjY = sy
		const adjX = sx
		const y = (adjY / TILE_H - adjX / TILE_W) / 2
		const x = (adjY / TILE_H + adjX / TILE_W) / 2
		return { x: Math.floor(x), y: Math.floor(y) }
	}

	drawTile(x: number, y: number): void {
		const tile = this.grid[y][x]
		const pos = this.gridToScreen(x, y)
		const g = tile.sprite

		g.clear()
		g.setDepth(y * GRID_SIZE + x)

		let color = COLORS.ground
		let height = 0

		if (tile.type === 'water') {
			color = COLORS.water
			height = -5
		}
		if (tile.type === 'mountain') {
			color = COLORS.mountain
			height = 20
		}
		if (tile.type === 'building') {
			color = COLORS.building
			height = 30
		}

		if (tile.type === 'water') g.fillStyle(color, 0.8)
		else g.fillStyle(color)

		g.beginPath()
		g.moveTo(pos.x, pos.y - height)
		g.lineTo(pos.x + TILE_W, pos.y + TILE_H - height)
		g.lineTo(pos.x, pos.y + TILE_H * 2 - height)
		g.lineTo(pos.x - TILE_W, pos.y + TILE_H - height)
		g.closePath()
		g.fill()

		if (height > 0) {
			g.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(20).color)
			g.beginPath()
			g.moveTo(pos.x + TILE_W, pos.y + TILE_H - height)
			g.lineTo(pos.x + TILE_W, pos.y + TILE_H)
			g.lineTo(pos.x, pos.y + TILE_H * 2)
			g.lineTo(pos.x, pos.y + TILE_H * 2 - height)
			g.closePath()
			g.fill()

			g.fillStyle(Phaser.Display.Color.IntegerToColor(color).darken(40).color)
			g.beginPath()
			g.moveTo(pos.x - TILE_W, pos.y + TILE_H - height)
			g.lineTo(pos.x - TILE_W, pos.y + TILE_H)
			g.lineTo(pos.x, pos.y + TILE_H * 2)
			g.lineTo(pos.x, pos.y + TILE_H * 2 - height)
			g.closePath()
			g.fill()
		}

		if (tile.type === 'building') {
			g.fillStyle(0xffff00)
			g.fillRect(pos.x - 10, pos.y - 15, 4, 4)
			g.fillRect(pos.x + 5, pos.y - 10, 4, 4)
		}
	}

	drawIsoTile(
		g: Phaser.GameObjects.Graphics,
		x: number,
		y: number,
		h: number,
		fill = true
	): void {
		g.beginPath()
		g.moveTo(x, y - h)
		g.lineTo(x + TILE_W, y + TILE_H - h)
		g.lineTo(x, y + TILE_H * 2 - h)
		g.lineTo(x - TILE_W, y + TILE_H - h)
		g.closePath()
		if (fill) g.fill()
		g.strokePath()
	}

	isValidGrid(x: number, y: number): boolean {
		return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE
	}

	isWalkable(x: number, y: number): boolean {
		if (!this.isValidGrid(x, y)) return false
		const tile = this.grid[y][x]
		if (tile.type === 'mountain' || tile.type === 'building') return false
		if (this.getUnitAt(x, y)) return false
		return true
	}

	spawnUnits(): void {
		this.addUnit('prime', 2, 4, true)
		this.addUnit('brute', 3, 3, true)
		this.addUnit('arty', 2, 2, true)

		this.addUnit('bug', 5, 5, false)
		this.addUnit('hornet', 6, 2, false)

		this.calculateEnemyIntents()
		this.updatePlayerIndicators()
	}

	addUnit(type: string, x: number, y: number, isPlayer: boolean): Unit {
		const u = new Unit(this, type, x, y, isPlayer)
		this.units.push(u)
		return u
	}

	getUnitAt(x: number, y: number): Unit | undefined {
		return this.units.find((u) => u.gridX === x && u.gridY === y && !u.dead)
	}

	handleInput(pointer: Phaser.Input.Pointer): void {
		if (!this.playerTurn || this.gameOver) return
		if (pointer.rightButtonDown()) return

		const pos = this.screenToGrid(pointer.worldX, pointer.worldY)
		if (!this.isValidGrid(pos.x, pos.y)) return

		if (this.selectedUnit && this.actionMode) {
			this.tryAttack(pos.x, pos.y)
			return
		}

		const clickedUnit = this.getUnitAt(pos.x, pos.y)

		if (this.selectedUnit && !clickedUnit) {
			if (
				!this.selectedUnit.moved &&
				this.canMoveTo(this.selectedUnit, pos.x, pos.y)
			) {
				this.moveUnit(this.selectedUnit, pos.x, pos.y)
			} else {
				this.deselect()
			}
		} else if (clickedUnit && clickedUnit.isPlayer && !clickedUnit.acted) {
			this.selectUnit(clickedUnit)
		} else {
			this.deselect()
		}
	}

	selectUnit(unit: Unit): void {
		if (this.selectedUnit) {
			this.selectedUnit.container.setScale(1)
		}

		this.selectedUnit = unit
		this.actionMode = false

		unit.container.setScale(1.1)
		this.drawOverlay()

		const unitActionsEl = document.getElementById('unit-actions')
		if (unitActionsEl) unitActionsEl.style.display = 'block'

		const nameEl = document.getElementById('selected-unit-name')
		if (nameEl) nameEl.innerText = unit.type.toUpperCase() + ' MECH'

		const btnAttack = document.getElementById('btn-attack') as HTMLButtonElement
		if (btnAttack) {
			btnAttack.disabled = unit.acted
			btnAttack.innerText = unit.acted ? 'ATTACKED' : 'ATTACK (E)'
		}

		const btnUndo = document.getElementById(
			'btn-undo-move'
		) as HTMLButtonElement
		if (btnUndo) btnUndo.disabled = !unit.moved

		const descEl = document.getElementById('action-desc')
		if (descEl) {
			descEl.innerText = unit.moved
				? 'Unit moved. Select Attack target or Undo Move (Q/Right-Click to Cancel).'
				: 'Click Green tiles to Move. Press Q/Right-Click to Cancel.'
		}
	}

	deselect(): void {
		if (this.selectedUnit) {
			this.selectedUnit.container.setScale(1)
		}

		this.selectedUnit = null
		this.actionMode = false

		this.playerActionGraphics.clear()
		this.drawOverlay()

		const unitActionsEl = document.getElementById('unit-actions')
		if (unitActionsEl) unitActionsEl.style.display = 'none'
	}

	enterAttackMode(): void {
		if (!this.selectedUnit || this.selectedUnit.acted) return

		if (this.actionMode) {
			this.actionMode = false
			this.drawOverlay()

			const btnAttack = document.getElementById(
				'btn-attack'
			) as HTMLButtonElement
			if (btnAttack) btnAttack.innerText = 'ATTACK (E)'

			const descEl = document.getElementById('action-desc')
			if (descEl) {
				descEl.innerText = this.selectedUnit.moved
					? 'Unit moved. Select Attack target or Undo Move (Q/Right-Click to Cancel).'
					: 'Click Green tiles to Move. Press Q/Right-Click to Cancel.'
			}
		} else {
			this.actionMode = true
			this.drawOverlay()

			const btnAttack = document.getElementById(
				'btn-attack'
			) as HTMLButtonElement
			if (btnAttack) btnAttack.innerText = 'CANCEL'

			const descEl = document.getElementById('action-desc')
			if (descEl) descEl.innerText = 'Select a target tile in Red.'
		}
	}

	canMoveTo(unit: Unit, tx: number, ty: number): boolean {
		if (unit.moved) return false

		const range = 4
		let queue = [{ x: unit.gridX, y: unit.gridY, dist: 0 }]
		let visited = new Set()
		visited.add(`${unit.gridX},${unit.gridY}`)

		while (queue.length > 0) {
			let curr = queue.shift()!
			if (curr.x === tx && curr.y === ty) return true

			if (curr.dist < range) {
				for (let d of DIRS) {
					let nx = curr.x + d.x
					let ny = curr.y + d.y
					if (this.isWalkable(nx, ny) && !visited.has(`${nx},${ny}`)) {
						visited.add(`${nx},${ny}`)
						queue.push({ x: nx, y: ny, dist: curr.dist + 1 })
					}
				}
			}
		}

		return false
	}

	moveUnit(unit: Unit, x: number, y: number): void {
		unit.updatePosition(x, y, true)
		unit.moved = true
		this.deselect()
		this.updatePlayerIndicators()

		this.time.delayedCall(250, () => this.selectUnit(unit))
	}

	undoMove(): void {
		if (
			this.selectedUnit &&
			this.selectedUnit.moved &&
			!this.selectedUnit.acted
		) {
			this.selectedUnit.updatePosition(
				this.selectedUnit.originalX,
				this.selectedUnit.originalY
			)
			this.selectedUnit.gridX = this.selectedUnit.originalX
			this.selectedUnit.gridY = this.selectedUnit.originalY
			this.selectedUnit.moved = false
			this.selectUnit(this.selectedUnit)
			this.updatePlayerIndicators()
		}
	}

	tryAttack(tx: number, ty: number): void {
		const u = this.selectedUnit!
		const dx = tx - u.gridX
		const dy = ty - u.gridY

		let valid = false

		if (u.type === 'prime' || u.type === 'brute') {
			if ((dx === 0 || dy === 0) && Math.abs(dx) + Math.abs(dy) > 0) {
				if (u.type === 'prime' && Math.abs(dx) + Math.abs(dy) === 1)
					valid = true
				if (u.type === 'brute') valid = true
			}
		} else if (u.type === 'arty') {
			valid = true
		}

		if (!valid) return

		u.acted = true
		u.moved = true

		if (u.type === 'prime') {
			this.damageTile(tx, ty, 2)
			this.pushTile(tx, ty, Math.sign(dx), Math.sign(dy))
		} else if (u.type === 'brute') {
			let hitX = u.gridX + Math.sign(dx)
			let hitY = u.gridY + Math.sign(dy)

			while (this.isValidGrid(hitX, hitY)) {
				if (
					this.getUnitAt(hitX, hitY) ||
					(this.grid[hitY][hitX].type !== 'ground' &&
						this.grid[hitY][hitX].type !== 'water')
				) {
					break
				}
				hitX += Math.sign(dx)
				hitY += Math.sign(dy)
			}

			if (this.isValidGrid(hitX, hitY)) {
				this.createProjectile(u.gridX, u.gridY, hitX, hitY)
				this.time.delayedCall(300, () => {
					this.damageTile(hitX, hitY, 1)
					this.pushTile(hitX, hitY, Math.sign(dx), Math.sign(dy))
				})
			}
		} else if (u.type === 'arty') {
			this.createProjectile(u.gridX, u.gridY, tx, ty, true)
			this.time.delayedCall(500, () => {
				this.damageTile(tx, ty, 1)
				for (let d of DIRS) {
					this.pushTile(tx + d.x, ty + d.y, d.x, d.y)
				}
			})
		}

		this.deselect()
		this.updatePlayerIndicators()
		this.updateUI()
	}

	damageTile(x: number, y: number, amount: number): void {
		if (!this.isValidGrid(x, y)) return

		const unit = this.getUnitAt(x, y)
		if (unit) {
			unit.takeDamage(amount)
			this.showFloatingText(x, y, `-${amount}`, 0xff0000)
		}

		const tile = this.grid[y][x]
		if (tile.type === 'building') {
			this.damageGrid(amount)
			this.cameras.main.shake(100, 0.01)
			this.showFloatingText(x, y, 'GRID DMG!', 0xffaa00)
		}

		if (tile.type === 'mountain') {
			this.showFloatingText(x, y, 'CRUMBLE', 0xaaaaaa)
		}
	}

	pushTile(x: number, y: number, dx: number, dy: number): void {
		if (!this.isValidGrid(x, y)) return

		const unit = this.getUnitAt(x, y)
		if (!unit) return

		const nextX = x + dx
		const nextY = y + dy

		if (!this.isValidGrid(nextX, nextY)) return

		const blocker = this.getUnitAt(nextX, nextY)
		const tile = this.grid[nextY][nextX]

		if (blocker || tile.type === 'mountain' || tile.type === 'building') {
			unit.takeDamage(1)
			this.showFloatingText(x, y, 'BUMP', 0xffaa00)

			if (blocker) {
				blocker.takeDamage(1)
				this.showFloatingText(nextX, nextY, 'BUMP', 0xffaa00)
			}

			if (tile.type === 'building') {
				this.damageGrid(1)
			}
		} else {
			unit.updatePosition(nextX, nextY, true)

			if (tile.type === 'water' && unit.type !== 'hornet') {
				unit.takeDamage(99)
				this.showFloatingText(nextX, nextY, 'DROWN', 0x0088ff)
			}
		}
	}

	damageGrid(amt: number): void {
		this.powerGrid = Math.max(0, this.powerGrid - amt)
		this.updateUI()

		if (this.powerGrid <= 0 && !this.gameOver) {
			this.gameOver = true
			const btnEndTurn = document.getElementById(
				'btn-end-turn'
			) as HTMLButtonElement
			if (btnEndTurn) btnEndTurn.disabled = true

			const message = this.add
				.text(
					this.cameras.main.centerX / 2,
					this.cameras.main.centerY / 2,
					'GAME OVER - GRID FAILED',
					{ fontSize: '32px', color: '#ff0000', backgroundColor: '#000000' }
				)
				.setOrigin(0.5)
				.setDepth(3000)

			this.time.delayedCall(3000, () => location.reload())
		}
	}

	endPlayerTurn(): void {
		console.log('endPlayerTurn')
		if (this.gameOver) return

		const btnEndTurn = document.getElementById(
			'btn-end-turn'
		) as HTMLButtonElement
		if (btnEndTurn) btnEndTurn.disabled = true

		this.playerTurn = false
		this.deselect()

		let delay = 0

		console.log('endPlayerTurn start')

		this.units.forEach((u) => {
			if (!u.isPlayer && !u.dead && u.intent) {
				this.time.delayedCall(delay, () => {
					if (u.dead) return
					this.executeEnemyAttack(u)
				})
				delay += 600
			}
		})

		this.time.delayedCall(delay + 500, () => {
			if (this.gameOver) return

			this.units.forEach((u) => {
				u.moved = false
				u.acted = false
				u.originalX = u.gridX
				u.originalY = u.gridY
			})

			if (this.turn < MAX_TURNS) {
				this.spawnEnemy()
			}

			this.calculateEnemyIntents()
			this.turn++

			if (this.turn > MAX_TURNS) {
				this.gameOver = true
				const btnEndTurnFinal = document.getElementById(
					'btn-end-turn'
				) as HTMLButtonElement
				if (btnEndTurnFinal) btnEndTurnFinal.disabled = true

				const message = this.add
					.text(
						this.cameras.main.centerX / 2,
						this.cameras.main.centerY / 2,
						'VICTORY! ALL TURNS SURVIVED.',
						{ fontSize: '32px', color: '#00ff00', backgroundColor: '#000000' }
					)
					.setOrigin(0.5)
					.setDepth(3000)

				this.time.delayedCall(3000, () => location.reload())
			} else {
				this.playerTurn = true
				this.updatePlayerIndicators()
				this.updateUI()

				const btnEndTurnNew = document.getElementById(
					'btn-end-turn'
				) as HTMLButtonElement
				if (btnEndTurnNew) btnEndTurnNew.disabled = false
			}
		})

		console.log('endPlayerTurn end')
	}

	spawnEnemy(): void {
		let attempts = 0

		while (attempts < 20) {
			let rx = Phaser.Math.Between(0, 7)
			let ry = Phaser.Math.Between(0, 7)

			if (this.isWalkable(rx, ry) && this.grid[ry][rx].type === 'ground') {
				this.addUnit(Math.random() > 0.5 ? 'bug' : 'hornet', rx, ry, false)

				const pos = this.gridToScreen(rx, ry)
				const g = this.add.graphics()
				g.fillStyle(0xff00ff)
				g.fillCircle(pos.x, pos.y + TILE_H, 10)

				this.tweens.add({ targets: g, alpha: 0, duration: 1000 })
				break
			}

			attempts++
		}
	}

	calculateEnemyIntents(): void {
		this.units.forEach((u) => {
			if (u.isPlayer || u.dead) return

			u.intent = null
			u.intentIcon.visible = false

			let target = this.findNearestTarget(u)

			if (target) {
				let dx = target.x - u.gridX
				let dy = target.y - u.gridY

				let mx = u.gridX
				let my = u.gridY

				if (Math.abs(dx) > Math.abs(dy)) {
					mx += Math.sign(dx)
					if (!this.isWalkable(mx, my)) {
						mx = u.gridX
						my += Math.sign(dy)
					}
				} else if (Math.abs(dy) > 0) {
					my += Math.sign(dy)
					if (!this.isWalkable(mx, my)) {
						my = u.gridY
						mx += Math.sign(dx)
					}
				}

				if (this.isWalkable(mx, my) && (mx !== u.gridX || my !== u.gridY)) {
					u.updatePosition(mx, my, true)
				}

				for (let d of DIRS) {
					let tx = u.gridX + d.x
					let ty = u.gridY + d.y

					if (this.isValidGrid(tx, ty)) {
						const tile = this.grid[ty][tx]
						const unit = this.getUnitAt(tx, ty)

						if (tile.type === 'building' || (unit && unit.isPlayer)) {
							u.setIntent({
								type: 'attack',
								target: { x: tx, y: ty },
								damage: 1,
							})
							break
						}
					}
				}

				if (!u.intent) {
					let foundIntent = false

					for (let d of DIRS) {
						let tx = u.gridX + d.x
						let ty = u.gridY + d.y

						if (this.isValidGrid(tx, ty) && !this.getUnitAt(tx, ty)) {
							u.setIntent({
								type: 'attack',
								target: { x: tx, y: ty },
								damage: 1,
							})
							foundIntent = true
							break
						}
					}

					if (!foundIntent) {
						if (this.isValidGrid(u.gridX + 1, u.gridY)) {
							u.setIntent({
								type: 'attack',
								target: { x: u.gridX + 1, y: u.gridY },
								damage: 1,
							})
						}
					}
				}
			}
		})

		this.drawOverlay()
	}

	executeEnemyAttack(u: Unit): void {
		if (!u.intent) return

		this.cameras.main.shake(50, 0.005)

		const tx = u.intent.target.x
		const ty = u.intent.target.y

		this.damageTile(tx, ty, 1)

		u.intent = null
		u.intentIcon.visible = false
		this.drawOverlay()
	}

	findNearestTarget(
		enemy: Unit
	): { x: number; y: number; isBuilding: boolean } | null {
		let nearest: { x: number; y: number; isBuilding: boolean } | null = null
		let minDist = 999

		const potentialTargets: { x: number; y: number; isBuilding: boolean }[] = []

		for (let y = 0; y < GRID_SIZE; y++) {
			for (let x = 0; x < GRID_SIZE; x++) {
				if (this.grid[y][x].type === 'building') {
					potentialTargets.push({ x, y, isBuilding: true })
				}
			}
		}

		this.units.forEach((p) => {
			if (p.isPlayer && !p.dead) {
				potentialTargets.push({ x: p.gridX, y: p.gridY, isBuilding: false })
			}
		})

		potentialTargets.forEach((target) => {
			let d =
				Math.abs(target.x - enemy.gridX) + Math.abs(target.y - enemy.gridY)

			if (d < minDist) {
				minDist = d
				nearest = target
			} else if (d === minDist && target.isBuilding) {
				nearest = target
			}
		})

		return nearest
	}

	updatePlayerIndicators(): void {
		this.units.forEach((u) => {
			if (u.isPlayer) {
				u.updateIndicators()
			}
		})
	}

	drawOverlay(): void {
		this.enemyIntentGraphics.clear()
		this.playerActionGraphics.clear()

		// Enemy Intent Lines
		this.units.forEach((u) => {
			if (!u.isPlayer && !u.dead && u.intent) {
				const start = this.gridToScreen(u.gridX, u.gridY)
				const end = this.gridToScreen(u.intent.target.x, u.intent.target.y)
				const startY = start.y + TILE_H - 15

				this.enemyIntentGraphics.lineStyle(2, 0xff0000, 0.8)
				this.enemyIntentGraphics.beginPath()
				this.enemyIntentGraphics.moveTo(start.x, startY)
				this.enemyIntentGraphics.lineTo(end.x, end.y + TILE_H)
				this.enemyIntentGraphics.strokePath()

				const p = this.gridToScreen(u.intent.target.x, u.intent.target.y)
				this.enemyIntentGraphics.fillStyle(0xff0000, 0.4)
				this.drawIsoTile(this.enemyIntentGraphics, p.x, p.y, 0)
			}
		})

		// Player Move/Attack Range
		if (this.selectedUnit) {
			const u = this.selectedUnit

			if (this.actionMode) {
				const g = this.playerActionGraphics
				g.fillStyle(COLORS.attack, 0.4)
				g.lineStyle(2, COLORS.attack, 1)

				if (u.type === 'prime') {
					for (let d of DIRS) {
						const tx = u.gridX + d.x
						const ty = u.gridY + d.y

						if (this.isValidGrid(tx, ty)) {
							const p = this.gridToScreen(tx, ty)
							this.drawIsoTile(g, p.x, p.y, 0)
						}
					}
				} else {
					for (let d of DIRS) {
						for (let i = 1; i < 8; i++) {
							const tx = u.gridX + d.x * i
							const ty = u.gridY + d.y * i

							if (this.isValidGrid(tx, ty)) {
								const p = this.gridToScreen(tx, ty)
								this.drawIsoTile(g, p.x, p.y, 0)
							} else break
						}
					}
				}
			} else if (!u.moved) {
				const g = this.playerActionGraphics
				g.fillStyle(COLORS.move, 0.4)
				g.lineStyle(1, COLORS.move, 0.8)

				let queue = [{ x: u.gridX, y: u.gridY, dist: 0 }]
				let visited = new Set()
				visited.add(`${u.gridX},${u.gridY}`)

				while (queue.length > 0) {
					let curr = queue.shift()!

					if (curr.dist > 0) {
						const p = this.gridToScreen(curr.x, curr.y)
						this.drawIsoTile(g, p.x, p.y, 0)
					}

					if (curr.dist < 3) {
						for (let d of DIRS) {
							let nx = curr.x + d.x
							let ny = curr.y + d.y

							if (this.isWalkable(nx, ny) && !visited.has(`${nx},${ny}`)) {
								visited.add(`${nx},${ny}`)
								queue.push({ x: nx, y: ny, dist: curr.dist + 1 })
							}
						}
					}
				}
			}
		}
	}

	createProjectile(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		arc = false
	): void {
		const start = this.gridToScreen(x1, y1)
		const end = this.gridToScreen(x2, y2)
		const startY = start.y + TILE_H - 15
		const endY = end.y + TILE_H - 15

		const ball = this.add.circle(start.x, startY, 5, 0xffaa00)
		ball.setDepth(1000)

		if (arc) {
			this.tweens.add({
				targets: ball,
				x: end.x,
				y: endY,
				duration: 500,
				onComplete: () => ball.destroy(),
			})

			this.tweens.add({
				targets: ball,
				y: Math.min(startY, endY) - 100,
				yoyo: true,
				duration: 250,
				ease: 'Sine.easeOut',
			})
		} else {
			this.tweens.add({
				targets: ball,
				x: end.x,
				y: endY,
				duration: 200,
				onComplete: () => ball.destroy(),
			})
		}
	}

	showFloatingText(x: number, y: number, text: string, color: number): void {
		const pos = this.gridToScreen(x, y)
		const centerY = pos.y + TILE_H - 40

		const t = this.add.text(pos.x, centerY, text, {
			fontSize: '16px',
			fontStyle: 'bold',
			color: '#fff',
			stroke: '#000',
			strokeThickness: 3,
		})
		t.setOrigin(0.5)
		t.setDepth(2000)

		this.tweens.add({
			targets: t,
			y: centerY - 40,
			alpha: 0,
			duration: 1000,
			onComplete: () => t.destroy(),
		})
	}

	updateUI(): void {
		const turnCountEl = document.getElementById('turn-count')
		if (turnCountEl) turnCountEl.innerText = `${this.turn}/${MAX_TURNS}`

		const pct = (this.powerGrid / this.maxPowerGrid) * 100
		const gridBarEl = document.getElementById('grid-bar') as HTMLElement
		if (gridBarEl) {
			gridBarEl.style.width = pct + '%'
			gridBarEl.style.backgroundColor = pct < 30 ? '#ff0000' : '#e6b800'
		}

		const gridPercentEl = document.getElementById('grid-percent')
		if (gridPercentEl) gridPercentEl.innerText = Math.floor(pct) + '%'

		const enemiesAttacking = this.units.filter(
			(u) => !u.isPlayer && !u.dead && u.intent
		).length
		const intentListEl = document.getElementById('enemy-intent-list')
		if (intentListEl) {
			intentListEl.innerText =
				enemiesAttacking > 0
					? `${enemiesAttacking} Threats detected!`
					: 'No imminent threats.'
		}

		const btnEndTurn = document.getElementById(
			'btn-end-turn'
		) as HTMLButtonElement
		if (btnEndTurn && !this.gameOver) {
			btnEndTurn.disabled = !this.playerTurn
		}

		const btnUndoMove = document.getElementById(
			'btn-undo-move'
		) as HTMLButtonElement
		if (btnUndoMove) {
			btnUndoMove.disabled = !(
				this.selectedUnit &&
				this.selectedUnit.moved &&
				!this.selectedUnit.acted
			)
		}
	}
}

export class ColonyScene implements BaseScene {
    game!: Phaser.Game
    scene!: MainScene

    create() {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#1a1a1a',
            scene: MainScene,
        }
    
        this.game = new Phaser.Game(config)
        this.scene = this.game.scene.getScene('MainScene') as MainScene
    }

    destroy() {
        this.game.destroy(true)
    }

    resize() {
        this.game.scale.resize(window.innerWidth, window.innerHeight)
    }
}