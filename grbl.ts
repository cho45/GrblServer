///<reference path="./typings/bundle.d.ts"/>

export const STATE_IDLE  = "Idle";
export const STATE_RUN   = "Run";
export const STATE_HOLD  = "Hold";
export const STATE_HOME  = "Home";
export const STATE_ALARM = "Alerm";
export const STATE_CHECK = "Check";
export const STATE_DOOR  = "Door";

const MESSAGE_STARTUP  = /^Grbl (\d\.\d)(.)/;
const MESSAGE_OK       = /^ok$/;
const MESSAGE_ERROR    = /^error:(.+)$/;
const MESSAGE_ALARM    = /^ALARM:(.+)$/;
const MESSAGE_FEEDBACK = /^\[(.+)\]$/;
const MESSAGE_STATUS   = /^<(.+)>$/;
const MESSAGE_DOLLAR   = /^\$/;

interface GrblStatus {
	state: string;
	version: GrblVersion;
	machinePosition: GrblPosition;
	workingPosition: GrblPosition;
	lastResult: string;
	lastFeedback: string;
	lastError: string;
	lastAlarm: string;
}

interface GrblVersion {
	major: number;
	minor: string;
}

interface GrblPosition {
	x : number;
	y : number;
	z : number;
}

export class GrblLineParserResult {
}

export class GrblLineParserResultStartup extends GrblLineParserResult {
	version: GrblVersion;
	constructor(version: GrblVersion) {
		super();
		this.version = version;
	}
}

export class GrblLineParserResultOk extends GrblLineParserResult {
}

export class GrblLineParserResultError extends GrblLineParserResult {
	message: string;
	constructor(message: string) {
		super();
		this.message = message;
	}
}

export class GrblLineParserResultAlarm extends GrblLineParserResult {
	message: string;
	constructor(message: string) {
		super();
		this.message = message;
	}
}

export class GrblLineParserResultFeedback extends GrblLineParserResult {
	message: string;
	constructor(message: string) {
		super();
		this.message = message;
	}
}

export class GrblLineParserResultDollar extends GrblLineParserResult {
	message: string;
	constructor(message: string) {
		super();
		this.message = message;
	}
}

export class GrblLineParserResultStatus extends GrblLineParserResult {
	state: string;
	machinePosition: GrblPosition;
	workingPosition: GrblPosition;
	plannerBufferCount: number;
	rxBufferCount: number;
}

export class GrblLineParser {
	constructor() {
	}

	parse(line: string): GrblLineParserResult {
		const parsers = [
			this.parseStatus,
			this.parseOk,
			this.parseError,
			this.parseAlarm,
			this.parseFeedback,
			this.parseDollar,
			this.parseStartup
		];

		line = line.replace(/\s+$/, '');

		for (let i = 0, it; (it = parsers[i]); i++) {
			var result = it.call(this, line);
			if (result) {
				return result;
			}
		}

		throw "unknown message: " + line;
	}

	parseStartup(line: string): GrblLineParserResult {
		if (!MESSAGE_STARTUP.test(line)) return false;
		return new GrblLineParserResultStartup(<GrblVersion>{
			major: +RegExp.$1,
			minor: RegExp.$2,
		});
	}

	parseOk(line): GrblLineParserResult {
		if (!MESSAGE_OK.test(line)) return false;
		return new GrblLineParserResultOk();
	}

	parseError(line): GrblLineParserResult {
		if (!MESSAGE_ERROR.test(line)) return false;
		return new GrblLineParserResultError(RegExp.$1);
	}

	parseAlarm(line): GrblLineParserResult {
		if (!MESSAGE_ALARM.test(line)) return false;
		return new GrblLineParserResultAlarm(RegExp.$1);
	}

	parseFeedback(line): GrblLineParserResult {
		if (!MESSAGE_FEEDBACK.test(line)) return false;
		return new GrblLineParserResultFeedback(RegExp.$1);
	}

	parseDollar(line: string): GrblLineParserResult {
		if (!MESSAGE_DOLLAR.test(line)) return false;
		return new GrblLineParserResultDollar(line);
	}

	parseStatus(line: string): GrblLineParserResult {
		if (!MESSAGE_STATUS.test(line)) return false;

		var ret = new GrblLineParserResultStatus();

		let params = RegExp.$1.split(/,/);
		ret.state = params.shift();

		let map = {};
		let current: string;
		for (let i = 0, len = params.length; i < len; i++) {
			let param: string = params[i];
			if (/^(.+):(.+)/.test(param)) {
				current = RegExp.$1;
				param = RegExp.$2;
				map[current] = new Array<number>();
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

		if (map['Buf']) {
			ret.plannerBufferCount = +map['Buf'][0];
		}

		if (map['RX']) {
			ret.rxBufferCount = +map['RX'][0];
		}

		return ret;
	}
}

export interface SerialPort {
	// node-serialport compatible
	open(cb: (err: any) => void);
	on(ev: string, cb: (e: any) => void);
	write(d: string);
	write(d: string, cb: (err: any, results: any) => void);
	close(cb: (err: any) => void);
}


import events = require("events");

export class Grbl extends events.EventEmitter {
	status : GrblStatus;
	serialport : SerialPort;
	parser : GrblLineParser;
	isOpened: boolean;
	isClosing: boolean;
	timer: NodeJS.Timer;
	waitingQueue: Array< (err: any) => void >;

	constructor(serialport: SerialPort) {
		super();
		this.status = <GrblStatus>{};
		this.serialport = serialport;
		this.parser = new GrblLineParser();
		this.isOpened = false;
		this.waitingQueue = [];
	}

	open():Promise<any> {
		return new Promise( (resolve, reject) => {
			this.serialport.open( (err) => {
				if (err) reject(err);
				this.isOpened = true;
				this.reset();

				this.serialport.on("data", (data) => {
					this.processData(data);
				});
				this.serialport.on("close", () => {
					if (!this.isClosing) {
						this.emit('error', 'unexpected close on the serialport');
					}
					this.destroy();
				});
				this.serialport.on("error", (err) => {
					this.emit('error', 'unexpected error on the serialport');
					this.destroy();
				});

				this.startTimer();

				this.once("startup", (r) => {
					resolve();
				});
			});
		});
	}

	startTimer() {
		this.timer = setTimeout( () => {
			this.getStatus();
			if (this.isOpened) {
				this.startTimer();
			}
		}, 1/10 * 1000);
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
			clearTimeout(this.timer);
		}
	}

	getConfig():Promise<any> {
		return new Promise( (resolve, reject) => {
		});
	}

	getStatus():Promise<any> {
		return new Promise( (resolve, reject) => {
	//		this.realtimeCommand("?");
		});
	}

	command(cmd: string):Promise<any> {
		return new Promise( (resolve, reject) => {
			console.log(cmd);
			this.serialport.write(cmd + '\n');
			this.waitingQueue.push( (err: any) => {
				if (err) return reject(err);
				resolve();
			});
		});
	}

	realtimeCommand(cmd: string) {
		this.serialport.write(cmd);
	}

	reset() {
		this.realtimeCommand("\x18");
	}

	processData(data: string) {
		if (/^\s*$/.test(data)) return;

		this.emit("raw", data);
		var result = this.parser.parse(data);
		this.emit("response", result);
		if (result instanceof GrblLineParserResultOk) {
			this.waitingQueue.shift()(null);
		} else
		if (result instanceof GrblLineParserResultError) {
			this.waitingQueue.shift()(result);
		} else
		if (result instanceof GrblLineParserResultStartup) {
			this.emit("startup", result);
		}
	}
}


