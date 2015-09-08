//#!tsc --target ES5 --module commonjs gcode.ts && node gcode.js

///<reference path="./typings/bundle.d.ts"/>

export namespace gcode {
	export class Motion {
		type: string;

		prevMotion: Motion;

		x: number = 0;
		y: number = 0;
		z: number = 0;

		// mm/min
		feedRate: number;

		constructor(prevMotion: Motion) {
			this.prevMotion = prevMotion;
		}

		get distance():number {
			var x = this.prevMotion.x - this.x;
			var y = this.prevMotion.y - this.y;
			var z = this.prevMotion.z - this.z;
			return Math.sqrt(x * x + y * y + z * z);
		}

		// return second
		get duration():number {
			return this.distance / this.feedRate * 60;
		}
	}

	export class Context {
		prevState: State;
		state: State;
		code: Code;
		motions: Array<Motion>;
		blockSub: Function;

		rapidFeedRate: number;

		get lastMotion():Motion {
			if (this.motions.length) {
				return this.motions[ this.motions.length - 1];
			} else {
				return null;
			}
		}

		handlers: { [letter: string]: Function }  = {
			'F' : () => {
				this.state.set(States.F, this.code.value);
			},

			'G' : () => {
				var handler = this.handlers[this.code.name];
				if (!handler) {
					console.log('unsupported G-code ' + this.code.name);
					return;
				}
				handler();
			},

			'G0' : () => {
				console.log('G0');
				this.state.set(States.MOTION, MotionMode.G0);

				this.blockSub = () => {
					this.drawLine(
						"G0",
						this.lastMotion.x,
						this.lastMotion.y,
						this.lastMotion.z,

						this.state.get(States.X),
						this.state.get(States.Y),
						this.state.get(States.Z),
						this.rapidFeedRate || Infinity
					);
				};
			},

			'G1' : () => {
				this.state.set(States.MOTION, MotionMode.G1);
				this.blockSub = () => {
					this.drawLine(
						"G1",
						this.lastMotion.x,
						this.lastMotion.y,
						this.lastMotion.z,

						this.state.get(States.X),
						this.state.get(States.Y),
						this.state.get(States.Z),

						this.state.get(States.F)
					);
				};
			},

			'G2' : () => {
				this.state.set(States.MOTION, MotionMode.G2);
				this.blockSub = () => {
					this.drawArc(
						"G2",
						this.state.get(States.PLANE),

						this.lastMotion.x,
						this.lastMotion.y,
						this.lastMotion.z,

						this.state.get(States.X),
						this.state.get(States.Y),
						this.state.get(States.Z),

						this.state.get(States.I),
						this.state.get(States.J),
						this.state.get(States.K),

						this.state.get(States.R),

						this.state.get(States.F)
					);
				};
			},

			'G3' : () => {
				this.state.set(States.MOTION, MotionMode.G3);
				this.blockSub = () => {
					this.drawArc(
						"G3",
						this.state.get(States.PLANE),

						this.lastMotion.x,
						this.lastMotion.y,
						this.lastMotion.z,

						this.state.get(States.X),
						this.state.get(States.Y),
						this.state.get(States.Z),

						this.state.get(States.I),
						this.state.get(States.J),
						this.state.get(States.K),

						this.state.get(States.R),

						this.state.get(States.F)
					);
				};
			},

			'G4' : () => {
				this.blockSub = () => {
					var sleep = 0;
					var P = this.state.get(States.P);
					if (P) {
						sleep = P * 1000;
					} else {
						sleep = this.state.get(States.X);
					}
					console.log('sleep', sleep);
				}
			},

			'G10' : () => {
				this.blockSub = () => {};
			},

			'G17' : () => {
				this.state.set(States.PLANE, PlaneMode.XY);
			},

			'G18' : () => {
				this.state.set(States.PLANE, PlaneMode.XZ);
			},

			'G19' : () => {
				this.state.set(States.PLANE, PlaneMode.YZ);
			},

			'G20' : () => {
				// throw "does not support inch";
				this.blockSub = () => {};
			},

			'G21' : () => {
				// nothing to do
				this.blockSub = () => {};
			},

			'G28' : () => {
				this.blockSub = () => {};
			},

			'G28.1' : () => {
				this.blockSub = () => {};
			},

			'G30' : () => {
				this.blockSub = () => {};
			},

			'G38.1' : () => {
				this.blockSub = () => {};
			},

			'G38.2' : () => {
				this.blockSub = () => {};
			},

			'G38.3' : () => {
				this.blockSub = () => {};
			},

			'G38.4' : () => {
				this.blockSub = () => {};
			},

			'G38.5' : () => {
				this.blockSub = () => {};
			},

			'G40' : () => {
				this.blockSub = () => {};
			},

			'G43.1' : () => {
				this.blockSub = () => {};
			},

			'G49' : () => {
				this.blockSub = () => {};
			},

			'G53' : () => {
				this.blockSub = () => {};
			},

			'G54' : () => {
				this.blockSub = () => {};
			},

			'G55' : () => {
				this.blockSub = () => {};
			},

			'G56' : () => {
				this.blockSub = () => {};
			},

			'G57' : () => {
				this.blockSub = () => {};
			},

			'G58' : () => {
				this.blockSub = () => {};
			},

			'G59' : () => {
				this.blockSub = () => {};
			},

			'G61' : () => {
				this.blockSub = () => {};
			},

			'G80' : () => {
				this.state.set(States.MOTION, MotionMode.UNDEFINED);
				this.blockSub = () => {};
			},

			'G90' : () => {
				this.state.set(States.DISTANCE_MODE, DistanceMode.ABSOLUTE);
			},

			'G91' : () => {
				this.state.set(States.DISTANCE_MODE, DistanceMode.RELATIVE);
			},

			'G91.1' : () => {
				this.blockSub = () => {};
			},

			'G92' : () => {
				this.blockSub = () => {};
			},

			'G92.1' : () => {
				this.blockSub = () => {};
			},

			'G93' : () => {
				// TODO does no supported yet
				this.state.set(States.FEED_RATE_MODE, FeedRateMode.INVERSE_TIME);
			},

			'G94' : () => {
				this.state.set(States.FEED_RATE_MODE, FeedRateMode.UNITS_PER_MINUTE);
			},

			'I' : () => {
				this.state.set(States.I, this.code.value);
			},

			'J' : () => {
				this.state.set(States.J, this.code.value);
			},

			'K' : () => {
				this.state.set(States.K, this.code.value);
			},

			'M' : () => {
				var handler = this.handlers[this.code.name];
				if (!handler) {
					console.log('unsupported M-code ' + this.code.name);
					return;
				}
				handler();
			},

			'M0' : () => {
				this.blockSub = () => {};
			},

			'M1' : () => {
				this.blockSub = () => {};
			},

			'M2' : () => {
				this.blockSub = () => {};
			},

			'M3' : () => {
				this.blockSub = () => {};
			},

			'M4' : () => {
				this.blockSub = () => {};
			},

			'M5' : () => {
				this.blockSub = () => {};
			},

			'M6' : () => {
				this.blockSub = () => {};
			},

			'M7' : () => {
				this.blockSub = () => {};
			},

			'M8' : () => {
				this.blockSub = () => {};
			},

			'M9' : () => {
				this.blockSub = () => {};
			},

			'M10' : () => {
				this.blockSub = () => {};
			},

			'M11' : () => {
				this.blockSub = () => {};
			},

			'M30' : () => {
				this.blockSub = () => {};
			},

			'N' : () => {
				this.state.set(States.LINE_NUMBER, this.code.value);
			},

			'P' : () => {
				this.state.set(States.P, this.code.value);
			},

			'R' : () => {
				this.state.set(States.R, this.code.value);
			},

			'S' : () => {
				this.state.set(States.S, this.code.value);
			},

			'T' : () => {
				this.state.set(States.T, this.code.value);
			},

			'X' : () => {
				this.state.setAxisValue(States.X, this.code.value);
			},

			'Y' : () => {
				this.state.setAxisValue(States.Y, this.code.value);
			},

			'Z' : () => {
				this.state.setAxisValue(States.Z, this.code.value);
			},
		};

		constructor() {
			this.state = new State(null);
			this.motions = [ new Motion(null) ];
		}

		executeBlock(block: Block):number {
			var elapsed = 0;

			this.prevState = this.state;
			this.state = new State(this.prevState);
			this.blockSub = null;
			for (let i = 0, it: Code; (it = block.codes[i]); i++) {
				var handler = this.handlers[it.letter];
				if (!handler) {
					console.log('warning ' + it.letter + ' handler is missing');
					continue;
				}
				this.code = it;
				handler();
			}

			// implicit move
			if (!this.blockSub) {
				var implicitHandler = this.handlers[this.state.get(States.MOTION)];
				if (implicitHandler) {
					implicitHandler();
				}
			}

			if (this.blockSub) {
				this.blockSub();
				this.blockSub = null;
			}

			this.state.clearModeless();

			return elapsed;
		}

		drawLine(
			type: string,
			x1:number, y1:number, z1:number,
			x2:number, y2:number, z2:number,
			feedRate: number
		) {
			if (!(
				this.lastMotion.x === x1 &&
				this.lastMotion.y === y1 &&
				this.lastMotion.z === z1
				)) {
				throw "invalid argument (does not match to last motion)";
			}

			var line = new Motion(this.lastMotion);
			line.type = type;
			line.x = x2;
			line.y = y2;
			line.z = z2;
			line.feedRate = feedRate;

			this.motions.push(line);
		}

		drawArc(
			type: string,
			plain: PlaneMode,
			x1:number, y1:number, z1:number,
			x2:number, y2:number, z2:number,
			xOffset:number, yOffset:number, zOffset:number,
			radius:number,
			feedRate: number
		) {
			var isClockWise = type === 'G2';

			var drawLine : ( type: string, x1:number, y1:number, z1:number, x2:number, y2:number, z2:number, feedRate: number )=> void;
			console.log(plain);
			if (plain === PlaneMode.XZ) {
				[x1, y1, z1] = [x1, z1, y1];
				[x2, y2, z2] = [x2, z2, y2];
				[xOffset, yOffset, zOffset] = [xOffset, zOffset, yOffset];
				drawLine = (type, xx, yy, zz, x, y, z, feedRate) => {
					this.drawLine( type, xx, zz, yy, x, z, y, feedRate );
				};
			} else
			if (plain === PlaneMode.YZ) {
				[x1, y1, z1] = [y1, z1, x1];
				[x2, y2, z2] = [y2, z2, x2];
				[xOffset, yOffset, zOffset] = [yOffset, zOffset, xOffset];
				drawLine = (type, xx, yy, zz, x, y, z, feedRate) => {
					this.drawLine( type, zz, xx, yy, z, x, y, feedRate );
				};
			} else {
				// PlaneMode.XY
				drawLine = (type, xx, yy, zz, x, y, z, feedRate) => {
					this.drawLine( type, xx, yy, zz, x, y, z, feedRate );
				};
			}

			if (radius) {
				var x = x2 - x1;
				var y = y2 - y1;
				// calculate offset
				var distance = Math.sqrt(x * x + y * y);
				var height = Math.sqrt(4 * radius * radius - x * x - y * y) / 2;
				if (isClockWise) {
					height = -height;
				}
				if (radius < 0) {
					height = -height;
				}
				xOffset = x / 2 - y / distance * height;
				yOffset = y / 2 + x / distance * height;
			}

			var centerX = x1 + xOffset;
			var centerY = y1 + yOffset;
			var radius = Math.sqrt(Math.pow(centerX - x1, 2) + Math.pow(centerY - y1, 2));

			var angle1 = (Math.atan2( (y1 - centerY), (x1 - centerX) ) + Math.PI * 2) % (Math.PI * 2);
			var angle2 = (Math.atan2( (y2 - centerY), (x2 - centerX) ) + Math.PI * 2) % (Math.PI * 2);
			if (angle2 < angle1) {
				angle2 += Math.PI * 2;
			}

			// calculate ccw angle
			var angleDelta = angle2 - angle1;
			// and consider cw
			if (isClockWise) {
				angleDelta = -Math.PI * 2 + angleDelta;
			}

			var xx = x1, yy = y1, zz = z1;

			for (let i = 0, points = 30; i < points; i++) {
				let angle = angle1 + (angleDelta / points * i);

				var x = Math.cos(angle) * radius + centerX;
				var y = Math.sin(angle) * radius + centerY;
				var z = (z2 - z1) / points * i + z1;

				drawLine( type, xx, yy, zz, x, y, z, feedRate );
				xx = x, yy = y, zz = z;
			}
			drawLine( type, xx, yy, zz, x2, y2, z2, feedRate );
		}
	}

	enum States {
		MOTION = <any>'MOTION',
		DISTANCE_MODE = <any>'DISTANCE_MODE',
		LINE_NUMBER = <any>'LINE_NUMBER',
		FEED_RATE_MODE = <any>'FEED_RATE_MODE',
		PLANE = <any>'PLANE',
		F = <any>'F',
		I = <any>'I',
		J = <any>'J',
		K = <any>'K',
		L = <any>'L',
		N = <any>'N',
		P = <any>'P',
		R = <any>'R',
		S = <any>'S',
		T = <any>'T',
		X = <any>'X',
		Y = <any>'Y',
		Z = <any>'Z',
	}

	enum MotionMode {
		UNDEFINED = <any>'UNDEFINED',
		G0 = <any>'G0',
		G1 = <any>'G1',
		G2 = <any>'G2',
		G3 = <any>'G3',
	}

	enum DistanceMode {
		ABSOLUTE = <any>'ABSOLUTE',
		RELATIVE = <any>'RELATIVE',
	}

	enum PlaneMode {
		XY = <any>'XY',
		XZ = <any>'XZ',
		YZ = <any>'YZ',
	}

	enum FeedRateMode {
		INVERSE_TIME = <any>'INVERSE_TIME',
		UNITS_PER_MINUTE = <any>'UNITS_PER_MINUTE',
	}


	export class State {
		_values  : { [name: string]: any };
		_updated : { [name: string]: boolean };

		constructor(state: State) {
			this._values = {};

			if (state) {
				// copy values
				for (var key in state._values) if (state._values.hasOwnProperty(key)) {
					this._values[key] = state._values[key];
				}
			} else {
				this._values[States.I] = 0;
				this._values[States.J] = 0;
				this._values[States.K] = 0;
				this._values[States.X] = 0;
				this._values[States.Y] = 0;
				this._values[States.Z] = 0;

				this._values[States.MOTION] = MotionMode.UNDEFINED;
				this._values[States.DISTANCE_MODE] = DistanceMode.ABSOLUTE;
				this._values[States.PLANE] = PlaneMode.XY;
				this._values[States.FEED_RATE_MODE] = FeedRateMode.UNITS_PER_MINUTE;
			}

			this._updated = {};
		}

		set(name: States, value: any) {
			if (this._updated[name]) {
				throw name + " is already updated";
			}
			this._values[name] = value;
			this._updated[name] = true;
		}

		setAxisValue(name: States, value: number) {
			if (this.get(States.DISTANCE_MODE) === DistanceMode.RELATIVE) {
				value += this.get(name);
			}
			this.set(name, value);
		}

		get(name: States):any {
			return this._values[name];
		}

		clearModeless() {
			delete this._values[States.P];
			delete this._values[States.R];
		}
	}

	export class Code {
		letter: string;
		value: number;

		constructor(letter: string, value: number) {
			this.letter = letter;
			this.value = value;
		}

		get name():string {
			return this.letter + String(this.value);
		}
	}

	export class Block {
		codes: Array<Code>;

		static parse(str: string):Block {
			str = str.replace(/\([^)]+\)/g, '');
			str = str.replace(/;.*/g, '');
			str = str.replace(/\s+/g, '');
			str = str.replace(/%/g, '');
			str = str.toUpperCase();

			var block = new Block();
			str = str.replace(/([A-Z])(-?[0-9.]+)/g, (_:string, letter: string, value: string) => {
				block.addCode(new Code(letter, +value));
				return '';
			});
			if (str) throw "unexpected token in this line: " + str;
			return block;
		}

		constructor() {
			this.codes = [];
		}

		addCode(code: Code) {
			this.codes.push(code);
		}
	}
}


