///<reference path="./typings/bundle.d.ts"/>

export const STATE_IDLE  = "Idle";
export const STATE_RUN   = "Run";
export const STATE_HOLD  = "Hold";
export const STATE_HOME  = "Home";
export const STATE_ALARM = "Alerm";
export const STATE_CHECK = "Check";
export const STATE_DOOR  = "Door";
// Special state for disconnected
export const STATE_UNKNOWN = "Unknown";

const MESSAGE_STARTUP  = /^Grbl (\d\.\d)(.)/;
const MESSAGE_OK       = /^ok$/;
const MESSAGE_ERROR    = /^error:(.+)$/;
const MESSAGE_ALARM    = /^ALARM:(.+)$/;
const MESSAGE_FEEDBACK = /^\[(.+)\]$/;
const MESSAGE_STATUS   = /^<(.+)>$/;
const MESSAGE_DOLLAR   = /^\$/;

interface GrblVersion {
	major: number;
	minor: string;
}

interface GrblPosition {
	x : number;
	y : number;
	z : number;
}

export interface GrblSerialPortError {
	message: string;
}

export class GrblLineParserResult {
	raw: string;
	constructor(raw: string) {
		this.raw = raw;
	}

	toObject(copy: { [key: string]: any }):{ [key: string]: any } {
		var ret: { [key: string]: any } = {};
		Object.keys(this).forEach( (key: string)=> {
			ret[key] = (<any>this)[key];
		});
		if (copy) {
			Object.keys(copy).forEach( (key: string)=> {
				ret[key] = copy[key];
			});
		}
		return ret;
	}
}

export class GrblLineParserResultStartup extends GrblLineParserResult {
	version: GrblVersion;
	static parse(line: string) {
		if (!MESSAGE_STARTUP.test(line)) return null;
		var ret = new this(line);
		ret.version = <GrblVersion>{
			major: +RegExp.$1,
			minor: RegExp.$2,
		};
		return ret;
	}
}

export class GrblLineParserResultOk extends GrblLineParserResult {
	static parse(line: string) {
		if (!MESSAGE_OK.test(line)) return null;
		return new this(line);
	}
}

export class GrblLineParserResultError extends GrblLineParserResult {
	message: string;
	static parse(line: string) {
		if (!MESSAGE_ERROR.test(line)) return null;
		var ret = new this(line);
		ret.message = RegExp.$1;
		return ret;
	}
}

export class GrblLineParserResultAlarm extends GrblLineParserResult {
	message: string;
	static parse(line: string) {
		if (!MESSAGE_ALARM.test(line)) return null;
		var ret = new this(line);
		ret.message = RegExp.$1;
		return ret;
	}
}

export class GrblLineParserResultFeedback extends GrblLineParserResult {
	message: string;
	static parse(line: string) {
		if (!MESSAGE_FEEDBACK.test(line)) return null;
		var ret = new this(line);
		ret.message = RegExp.$1;
		return ret;
	}
}

export class GrblLineParserResultDollar extends GrblLineParserResult {
	static parse(line: string) {
		if (!MESSAGE_DOLLAR.test(line)) return null;
		var ret = new this(line);
		return ret;
	}
}

export class GrblLineParserResultStatus extends GrblLineParserResult {
	state: string;
	machinePosition: GrblPosition;
	workingPosition: GrblPosition;
	plannerBufferCount: number;
	rxBufferCount: number;

	static UNKNOWN = new GrblLineParserResultStatus(null);

	static parse(line: string) {
		if (!MESSAGE_STATUS.test(line)) return null;

		var ret = new this(line);

		let params = RegExp.$1.split(/,/);
		ret.state = params.shift();

		let map : { [name: string]:Array<string>; } = {};
		let current: string;
		for (let i = 0, len = params.length; i < len; i++) {
			let param: string = params[i];
			if (/^(.+):(.+)/.test(param)) {
				current = RegExp.$1;
				param = RegExp.$2;
				map[current] = new Array<string>();
			}
			if (!current) {
				throw "Illegal status format: " + line;
			}

			map[current].push(param);
		}

		ret.machinePosition = <GrblPosition>{
			x: +map['MPos'][0],
			y: +map['MPos'][1],
			z: +map['MPos'][2],
		};

		ret.workingPosition = <GrblPosition>{
			x: +map['WPos'][0],
			y: +map['WPos'][1],
			z: +map['WPos'][2],
		};

		if (map.hasOwnProperty('Buf')) {
			ret.plannerBufferCount = +map['Buf'][0];
		}

		if (map.hasOwnProperty('RX')) {
			ret.rxBufferCount = +map['RX'][0];
		}

		return ret;
	}

	constructor(raw: string) {
		super(raw);
		this.state = STATE_UNKNOWN;
		this.machinePosition = { x: 0, y: 0, z: 0};
		this.workingPosition = { x: 0, y: 0, z: 0};
	}

	equals(other: GrblLineParserResultStatus): boolean {
		var ret = 
			this.state === other.state &&
			this.plannerBufferCount === other.plannerBufferCount &&
			this.rxBufferCount === other.rxBufferCount &&
			this.machinePosition.x === other.machinePosition.x &&
			this.machinePosition.y === other.machinePosition.y &&
			this.machinePosition.z === other.machinePosition.z &&
			this.workingPosition.x === other.workingPosition.x &&
			this.workingPosition.y === other.workingPosition.y &&
			this.workingPosition.z === other.workingPosition.z;

		return ret;
	}
}

export class GrblLineParser {
	constructor() {
	}

	parse(line: string): GrblLineParserResult {
		const parsers = [
			GrblLineParserResultStatus,
			GrblLineParserResultOk,
			GrblLineParserResultError,
			GrblLineParserResultAlarm,
			GrblLineParserResultFeedback,
			GrblLineParserResultDollar,
			GrblLineParserResultStartup
		];

		for (let i = 0, it: { parse: (line: string)=> GrblLineParserResult }; (it = parsers[i]); i++) {
			var result = it.parse(line);
			if (result) {
				return result;
			}
		}

		// console.log("unknown message: " + line);
		return null;
	}
}

export interface SerialPort {
	// node-serialport compatible
	open(cb: (err: any) => void): any;
	on(ev: string, cb: (e: any) => void): any;
	write(d: string): any;
	write(d: string, cb: (err: any, results: any) => void): any;
	close(cb: (err: any) => void): any;
}


import events = require("events");

export class Grbl extends events.EventEmitter {
	status : GrblLineParserResultStatus;
	lastFeedback: GrblLineParserResultFeedback;
	lastAlarm: GrblLineParserResultAlarm;

	serialport : SerialPort;
	parser : GrblLineParser;
	isOpened: boolean;
	isClosing: boolean;
	statusQueryTimer: NodeJS.Timer;
	waitingQueue: Array< (err: any) => void >;

	DEBUG: boolean;

	constructor(serialport: SerialPort) {
		super();
		this.status = GrblLineParserResultStatus.UNKNOWN;
		this.serialport = serialport;
		this.parser = new GrblLineParser();
		this.isOpened = false;
		this.waitingQueue = [];
		this.DEBUG = false;
	}

	open():Promise<any> {
		this.on("startup", (r: GrblLineParserResultStartup) => {
			this.waitingQueue = [];
			this.stopQueryStatus();
			this.realtimeCommand("?");
			this.startQueryStatus();
		});

		return new Promise( (resolve, reject) => {
			this.serialport.open( (err) => {
				if (err) {
					this.emit('error', <GrblSerialPortError>{ message: 'error on opening serialport' });
					reject(err);
					return;
				}
				this.isOpened = true;
				this.reset();

				this.serialport.on("data", (data) => {
					this.processData(data);
				});
				this.serialport.on("close", () => {
					if (!this.isClosing) {
						this.emit('error', <GrblSerialPortError>{ message: 'unexpected close on the serialport' });
					}
					this.destroy();
				});
				this.serialport.on("error", (err) => {
					this.emit('error', <GrblSerialPortError>{ message: 'unexpected error on the serialport' });
					this.destroy();
				});

				this.once("startup", (r: GrblLineParserResultStartup) => {
					resolve();
				});
			});
		});
	}

	startQueryStatus() {
		this.statusQueryTimer = setTimeout( () => {
			this.getStatus();
			if (this.isOpened) {
				this.startQueryStatus();
			}
		}, 1/10 * 1000);
	}

	stopQueryStatus() {
		clearTimeout(this.statusQueryTimer);
		this.statusQueryTimer = null;
	}

	close():Promise<any> {
		return new Promise( (resolve, reject) => {
			this.isClosing = true;
			this.reset();
			this.serialport.close((err) => {
				if (err) reject(err);
				this.destroy();
				resolve();
			});
		});
	}

	destroy() {
		if (this.isOpened) {
			this.isOpened = false;
			this.stopQueryStatus();
			this.status = GrblLineParserResultStatus.UNKNOWN;
			this.emit("statuschange", this.status);
		}
	}

	getConfig():Promise<Array<GrblLineParserResultDollar>> {
		return new Promise( (resolve, reject) => {
			if (this.status.state != STATE_IDLE) {
				reject('Must called in idle state');
			}

			var results: Array<GrblLineParserResultDollar> = [];
			var listener = (e: GrblLineParserResultDollar) => {
				results.push(e);
			};
			this.on("dollar", listener);
			this.command("$$").
				then( () => {
					this.removeListener("dollar", listener);
					resolve(results);
				}, reject);
		});
	}

	getStatus():Promise<any> {
		return new Promise( (resolve, reject) => {
			if (this.status.state !== STATE_ALARM &&
				this.status.state !== STATE_HOME ) {
				this.once("status", (res: GrblLineParserResultStatus) => {
					resolve(res);
				});
				this.realtimeCommand("?");
			} else {
				reject("state is alarm or homing");
			}
		});
	}

	command(cmd: string):Promise<any> {
		var ret = new Promise( (resolve, reject) => {
			if (this.DEBUG) console.log('>>', cmd);
			this.serialport.write(cmd + '\n');
			this.waitingQueue.push( (err: any) => {
				if (err) return reject(err);
				resolve();
			});
		});

		if (cmd === '$H') {
			// command "?" is not usable in homing
			var prevState = this.status.state;
			this.status.state = STATE_HOME;
			this.stopQueryStatus();
			this.emit("statuschange", this.status);
			this.emit("status", this.status);

			ret = ret.then( (): any => {
				this.status.state = prevState;
				this.startQueryStatus();
			} );
		}

		return ret;
	}

	realtimeCommand(cmd: string) {
		this.serialport.write(cmd);
	}

	reset() {
		this.realtimeCommand("\x18");
	}

	processData(data: string) {
		data = data.replace(/\s+$/, '');
		if (this.DEBUG) console.log('<<', data);
		if (!data) return;

		this.emit("raw", data);
		var result = this.parser.parse(data);
		if (!result) return;
		this.emit("response", result);
		if (result instanceof GrblLineParserResultStatus) {
			if (!this.status.equals(result)) {
				this.emit("statuschange", result);
			}
			this.status = result;
			this.emit("status", result);
		} else
		if (result instanceof GrblLineParserResultOk) {
			// callback maybe null after reseting
			var callback = this.waitingQueue.shift();
			if (callback) callback(null);
		} else
		if (result instanceof GrblLineParserResultError) {
			// callback maybe null after reseting
			var callback = this.waitingQueue.shift();
			if (callback) callback(result);
		} else
		if (result instanceof GrblLineParserResultStartup) {
			this.emit("startup", result);
		} else
		if (result instanceof GrblLineParserResultAlarm) {
			// command "?" is not usable in alarm,
			// so set state by hand
			this.status.state = STATE_ALARM;
			this.lastAlarm = result;
			this.emit("alarm", result);
			this.emit("statuschange", this.status);
			this.emit("status", this.status);
		} else
		if (result instanceof GrblLineParserResultFeedback) {
			this.lastFeedback = result;
			this.emit("feedback", result);
		} else
		if (result instanceof GrblLineParserResultDollar) {
			this.emit("dollar", result);
		}
	}
}


