/// <reference path="node/node.d.ts" />

declare module "serialport" {
	import events = require("events");

	export interface ParserFunc {
		(emitter: events.EventEmitter, buffer: NodeBuffer): void;
	}

	interface Parsers {
		raw: ParserFunc;
		readline: (delimiter?: string) => ParserFunc;
	}

	export interface SerialOptions {
		baudrate?: number;
		databits?: number;
		stopbits?: number;
		parity?: string;
		buffersize?: number;
		parser?: ParserFunc;
	}

	export var parsers: Parsers;
	export class SerialPort {
		constructor(port: string, options: SerialOptions, openImmediately: boolean);
		on(event: string, listener: Function): void;
		write(buffer: string);
		open(callback: (e)=>void): void;
		close(callback: (e)=>void): void;
	}
}

