// for collision check
// create a check collission from game object
// every game object will be stored in an array of observers
// the game object will check each update if it

const LEFT = "left";
const RIGHT = "right";
const SPACE = "space";
const PLAYER_SIZE = {
	height: 25,
	width: 50,
};
const PLAYER_COLOR = "#fff";
const PLAYER_SPEED = 10;
const MISSLE_SIZE = {
	height: 25,
	width: 5,
};
const MISSLE_SPEED = 10;
const INVADER_SIZE = {
	height: 40,
	width: 40,
};
const INVADER_COLOR = "rgba(0,0,0,0)";
const INVADER_IMG = new Image();
const INVADER_IMGS = [
	"./assets/sprites/invader_1/sprite_0.png",
	"./assets/sprites/invader_1/sprite_1.png",
	"./assets/sprites/invader_1/sprite_2.png",
];

// subject for observer pattern
class Game {
	static _score;
	static _canvas;
	static _player;
	static playerDirection;
	static moveQueue;
	static gameObjects = {
		invaders: [],
		playerMissle: null,
		enemyMissle: null,
	};
	static invaderXDirection = 1;
	static isPaused = false;
	static playerLives = 3;
	static invaderCount = 30;

	constructor() {}

	static start() {
		this.before = 0;
		this.secondsPassed = 0;
		this._score = 0;
		this._canvas = new Canvas(600, 760);
		this._player = new Player(
			new Vector(700, 570),
			PLAYER_COLOR,
			PLAYER_SIZE,
			PLAYER_SPEED
		);
		this.moveQueue = new Queue();
		this.gameObjects.invaders = this.generateInvaders();
		this._canvas.draw(this._player, this.gameObjects, 0, 0);
		window.addEventListener("keydown", this.listenForInput.bind(this));
		window.requestAnimationFrame((timeStamp) => {
			this.update(timeStamp);
		});
	}

	static update(time) {
		this.secondsPassed += (time - this.before) / 1000;
		let secs = Math.round(this.secondsPassed);
		this.before = time;

		if (this.playerLives === 0) {
			alert("Game Over");
			return;
		}

		if (this.invaderCount === 0) {
			alert("Game Won");
			return;
		}

		if (!this.isPaused) {
			if (this.moveQueue.size > 0) {
				let move = this.moveQueue.remove();

				if (move != SPACE) {
					this._player.update(move);
				} else if (!this.gameObjects.playerMissle) {
					this.gameObjects.playerMissle = this.generateMissle(this._player);
				}
			}

			if (this.gameObjects.playerMissle) {
				let playerMissle = this.gameObjects.playerMissle;
				if (playerMissle.y === 0) {
					playerMissle = null;
				} else {
					let currentMisslePos = playerMissle;
					let newPos = new Vector(
						currentMisslePos.x,
						currentMisslePos.y - playerMissle.speed
					);

					playerMissle.position = newPos;
				}

				this.gameObjects.playerMissle = playerMissle;
			}

			if (this.gameObjects.invaders.length > 0) {
				let invaders = this.gameObjects.invaders;
				let yDirection = 0;

				let randomRow = Math.floor(Math.random() * invaders.length);
				let randomColumn = Math.floor(
					Math.random() * invaders[randomRow].length - 1
				);

				if (!this.gameObjects.enemyMissle && secs % 2 === 0) {
					this.gameObjects.enemyMissle = this.generateMissle(
						invaders[randomRow][randomColumn]
					);
				}

				if (this.invaderXDirection < 0) {
					for (let i = 0; i < invaders.length; i++) {
						for (let j = 0; j < invaders[i].length; j++) {
							if (invaders[i][j].x === 0) {
								yDirection = 40;
								this.invaderXDirection = 1;
								break;
							}
						}
					}
				} else if (this.invaderXDirection > 0) {
					for (let i = 0; i < invaders.length; i++) {
						for (let j = 0; j < invaders[i].length; j++) {
							if (
								invaders[i][j].x + INVADER_SIZE.width ===
								this._canvas.width
							) {
								yDirection = 40;
								this.invaderXDirection = -1;
								break;
							}
						}
					}
				}
				this.gameObjects.invaders.forEach((row) => {
					row.forEach((invader) => {
						if (invader) {
							invader.update(yDirection, this.invaderXDirection, 0.5);
						}
					});
				});
			}

			/// at this point everyone has been updated, and collision can be checked
			// and collided with entities can be removed

			if (
				this.gameObjects.invaders.length > 0 &&
				this.gameObjects.playerMissle
			) {
				let misslePos = this.gameObjects.playerMissle.position;
				let collision = false;

				for (let i = 0; i < this.gameObjects.invaders.length; i++) {
					if (collision) {
						break;
					}
					for (let j = 0; j < this.gameObjects.invaders[i].length; j++) {
						let invader = this.gameObjects.invaders[i][j];
						if (invader) {
							let invaderPos = invader.position;
							// let pointA = invaderPos.y + INVADER_SIZE.height;
							if (
								misslePos.x + MISSLE_SIZE.width / 2 >= invaderPos.x &&
								misslePos.x + MISSLE_SIZE.width / 2 <=
									invaderPos.x + INVADER_SIZE.width &&
								misslePos.y > invaderPos.y &&
								misslePos.y < invaderPos.y + INVADER_SIZE.height
							) {
								// this.gameObjects.invaders[i][j] = null;
								this.gameObjects.invaders[i].splice(j, 1);
								collision = true;
								break;
							}
						}
					}
				}

				if (collision) {
					this.gameObjects.playerMissle = null;
					this.invaderCount--;
				}
			}

			if (this.gameObjects.enemyMissle) {
				let lastPos = this.gameObjects.enemyMissle.position;
				if (lastPos.y === this._canvas.height) {
					this.gameObjects.enemyMissle = null;
				} else if (
					lastPos.x >= this._player.position.x &&
					lastPos.x <= this._player.position.x + PLAYER_SIZE.width &&
					lastPos.y >= this._player.position.y &&
					lastPos.y <= this._player.y + PLAYER_SIZE.height
				) {
					this.playerLives--;
					this.gameObjects.enemyMissle = null;
				} else {
					let newPos = new Vector(
						lastPos.x,
						lastPos.y + this.gameObjects.enemyMissle.speed
					);
					this.gameObjects.enemyMissle.position = newPos;
				}
			}

			this._canvas.draw(this._player, this.gameObjects, secs);
		}

		window.requestAnimationFrame((timeStamp) => this.update(timeStamp));
	}

	static listenForInput(event) {
		switch (event.key) {
			case "ArrowLeft":
				this.moveQueue.add(LEFT);
				break;
			case "ArrowRight":
				this.moveQueue.add(RIGHT);
				break;
			case " ":
				this.moveQueue.add(SPACE);
				break;
			case "p":
				this.isPaused = !this.isPaused;
				break;
		}
	}

	static generateInvaders() {
		let invaders = [];

		for (let i = 1; i < 4; i++) {
			let row = [];
			for (let j = 1; j < 11; j++) {
				let size = {
					height: 30,
					width: 40,
				};
				let x = size.width * j + 20 * j;
				let y = size.height * i + 20 * i;
				let pos = new Vector(x, y);
				let invader = new Animator(
					pos,
					INVADER_COLOR,
					INVADER_SIZE,
					0,
					INVADER_IMGS
				);
				row.push(invader);
			}

			invaders.push(row);
		}
		return invaders;
	}

	static generateMissle(shooter) {
		if (!shooter) {
			return;
		}
		let missleStartPosition = new Vector(
			shooter.x + shooter.width / 2 - MISSLE_SIZE.width / 2,
			shooter.y
		);
		let missleSize = MISSLE_SIZE;
		return new GameObject(missleStartPosition, "#fff", missleSize, 5);
	}
}

class GameObject {
	position;
	color;
	size;
	speed;
	constructor(vector, color, size, speed) {
		this.position = vector;
		this.color = color;
		this.size = size;
		this.speed = speed;
	}

	get x() {
		return this.position.x;
	}

	get y() {
		return this.position.y;
	}

	get height() {
		return this.size.height;
	}

	get width() {
		return this.size.width;
	}

	update(yDirection, xDirection, speed) {
		let oldPosition = this.position;
		let newPos = new Vector(
			oldPosition.x + speed * xDirection,
			oldPosition.y + speed * yDirection
		);

		this.position = newPos;
	}
}

class Collidable extends GameObject {
	detectCollision() {}
}

class Player extends GameObject {
	constructor(vector, color, size, speed) {
		super(vector, color, size, speed);
	}

	update(move) {
		let x = this.position.x;
		switch (move) {
			case LEFT:
				this.position = new Vector(x - this.speed, this.position.y);
				break;
			case RIGHT:
				this.position = new Vector(x + this.speed, this.position.y);
				break;
		}
	}
}

class Missle extends GameObject {
	constructor(vector, color, size, speed) {
		super(vector, color, size, speed);
	}

	update() {}
}

class Vector {
	_x;
	_y;

	constructor(x, y) {
		this._x = x;
		this._y = y;
	}

	set x(num) {
		this._x = num;
	}

	get x() {
		return this._x;
	}

	set y(num) {
		this._y = num;
	}

	get y() {
		return this._y;
	}
}

class Canvas {
	_canvas;
	_context;
	_height;
	_width;
	animationTimer;
	constructor(height, width) {
		this._canvas = document.getElementById("canvas");
		this._context = this._canvas.getContext("2d");
		this._canvas.height = height;
		this._canvas.width = width;
		this._canvas.style.backgroundColor = "#101";
		this._height = height;
		this._width = width;
		this.animationTimer = 0;
	}

	get canvas() {
		return this._canvas;
	}

	get width() {
		return this._width;
	}

	get height() {
		return this._height;
	}
	draw(player, objects, seconds) {
		if (this.animationTimer != seconds) {
			this.animationTimer = seconds;
		}
		this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

		this.drawObject(player);

		for (let obj in objects) {
			if (obj === "invaders") {
				if (objects[obj].length > 0) {
					this.drawInvaders(objects[obj], seconds);
				}
			} else {
				if (objects[obj]) {
					this.drawObject(objects[obj]);
				}
			}
		}
	}

	drawObject(object) {
		this._context.fillStyle = object.color;
		this._context.fillRect(object.x, object.y, object.width, object.height);
	}

	drawInvader(invader) {
		this.drawAnimator(invader);
	}

	drawInvaders(invaders, now, before) {
		invaders.forEach((row) => {
			row.forEach((invader) => {
				if (invader) {
					this.drawInvader(invader, now, before);
				}
			});
		});
	}

	drawAnimator(animator) {
		this._context.save();
		this._context.translate(
			animator.x + animator.width / 2,
			animator.y + animator.height / 2
		);
		this._context.rotate((90 * Math.PI) / 180);
		this._context.drawImage(
			animator.img,
			(animator.width / 2) * -1,
			(animator.height / 2) * -1,
			animator.width + 15,
			animator.height + 15
		);
		this._context.restore();
	}
}

class Queue {
	_queue = [];
	constructor() {}

	add(item) {
		this._queue.unshift(item);
	}

	remove() {
		if (this._queue.length < 1) {
			return;
		}
		return this._queue.shift();
	}

	get size() {
		return this._queue.length;
	}
}

class Animator extends GameObject {
	_timePassed;
	_lastTime;
	_img;
	_spriteSet;
	_animationTimer;
	_spitePosition;
	constructor(vector, color, size, speed, spriteSet) {
		super(vector, color, size, speed);
		this._img = new Image();
		this._spriteSet = spriteSet;
		this._spitePosition = 0;
		this._img.src = this._spriteSet[0];
		this._animationTimer = 0;
		window.requestAnimationFrame((timeStamp) => this.animate(timeStamp));
	}

	get img() {
		return this._img;
	}

	animate(timeStamp) {
		this._timePassed = (timeStamp - this._lastTime) / 1000;
		this._animationTimer++;
		this._lastTime = timeStamp;

		if (this._animationTimer % 15 === 0) {
			if (this._spitePosition === this._spriteSet.length) {
				this._spitePosition = 0;
			}
			this._img.src = this._spriteSet[this._spitePosition];
			this._animationTimer = 0;
			this._spitePosition++;
		}

		window.requestAnimationFrame((time) => this.animate(time));
	}
}

Game.start();
