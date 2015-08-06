//#!tsc --target ES5 --module commonjs test.ts && node test.js

import {
	Grbl,
	GrblLineParser,
	GrblLineParserResult,
	GrblLineParserResultStartup,
	GrblLineParserResultOk,
	GrblLineParserResultError,
	GrblLineParserResultAlarm,
	GrblLineParserResultFeedback,
	GrblLineParserResultDollar,
	GrblLineParserResultStatus,
	SerialPort
}  from "./grbl";

import assert = require('assert');


var parser = new GrblLineParser();

var result;

result = parser.parse("Grbl 0.9j ['$' for help]");
assert(result instanceof GrblLineParserResultStartup);
assert(result.version.major == '0.9');
assert(result.version.minor == 'j');
result = parser.parse("Grbl 0.9 ['$' for help]");
assert(result instanceof GrblLineParserResultStartup);
assert(result.version.major == '0.9');
assert(result.version.minor == ' ');
result = parser.parse("Grbl 0.51 ['$' for help]");
assert(result instanceof GrblLineParserResultStartup);
assert(result.version.major == '0.5');
assert(result.version.minor == '1');


result = parser.parse("<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>");
assert(result instanceof GrblLineParserResultStatus);
assert(result.state == 'Idle');
assert(result.machinePosition.x == 0);
assert(result.machinePosition.y == 0);
assert(result.machinePosition.z == 0);
assert(result.workingPosition.x == 0);
assert(result.workingPosition.y == 0);
assert(result.workingPosition.z == 0);
assert(result.plannerBufferCount == undefined);
assert(result.rxBufferCount == undefined);

result = parser.parse("<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000,Buf:0>");
assert(result instanceof GrblLineParserResultStatus);
assert(result.state == 'Idle');
assert(result.machinePosition.x == 0);
assert(result.machinePosition.y == 0);
assert(result.machinePosition.z == 0);
assert(result.workingPosition.x == 0);
assert(result.workingPosition.y == 0);
assert(result.workingPosition.z == 0);
assert(result.plannerBufferCount == 0);
assert(result.rxBufferCount == undefined);

result = parser.parse("<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000,Buf:0,RX:0>");
assert(result instanceof GrblLineParserResultStatus);
assert(result.state == 'Idle');
assert(result.machinePosition.x == 0);
assert(result.machinePosition.y == 0);
assert(result.machinePosition.z == 0);
assert(result.workingPosition.x == 0);
assert(result.workingPosition.y == 0);
assert(result.workingPosition.z == 0);
assert(result.plannerBufferCount == 0);
assert(result.rxBufferCount == 0);

result = parser.parse("[Reset to continue]");
assert(result instanceof GrblLineParserResultFeedback);
assert(result.message == 'Reset to continue');
result = parser.parse("['$H'|'$X' to unlock]");
assert(result instanceof GrblLineParserResultFeedback);
result = parser.parse("[Caution: Unlocked]");
assert(result instanceof GrblLineParserResultFeedback);
result = parser.parse("[Enabled]");
assert(result instanceof GrblLineParserResultFeedback);
result = parser.parse("[Disabled]");
assert(result instanceof GrblLineParserResultFeedback);

result = parser.parse("ALARM:Hard/soft limit");
assert(result instanceof GrblLineParserResultAlarm);
assert(result.message == 'Hard/soft limit');
result = parser.parse("ALARM:Abort during cycle");
assert(result instanceof GrblLineParserResultAlarm);
result = parser.parse("ALARM:Probe fail");
assert(result instanceof GrblLineParserResultAlarm);

result = parser.parse("error:Invalid gcode ID:XX");
assert(result instanceof GrblLineParserResultError);
assert(result.message == 'Invalid gcode ID:XX');

result = parser.parse("$20=1");
assert(result instanceof GrblLineParserResultDollar);
assert(result.message == '$20=1');

import events = require("events");

class MockSerialPort extends events.EventEmitter implements SerialPort {
	written: Array<string>;

	constructor() {
		super();
		this.written = [];
	}

	open(cb: (err: any) => void) {
		setTimeout(cb, 0);
	}

	write(d: string, cb?: (err: any, results: any) => void) {
		this.written.unshift(d);
	}

	close(cb: (err: any) => void) {
		setTimeout(cb, 0);
	}
}

var mock = new MockSerialPort();

var grbl = new Grbl(mock);
grbl.open().then( () => {
	console.log('open');
	mock.emit("data", "Grbl v0.9j ['$' for help]\r\n");
});

grbl.on("raw", (e) => {
	console.log(e);
});

grbl.on("statusupdate", (e) => {
});


console.log('done');
grbl.close();
