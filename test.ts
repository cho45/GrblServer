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

var s1 = new GrblLineParserResultStatus();
s1.state = 'Idle';
s1.machinePosition = {x : 0, y : 0, z : 0};
s1.workingPosition = {x : 0, y : 0, z : 0};
var s2 = new GrblLineParserResultStatus();
s2.state = 'Idle';
s2.machinePosition = {x : 0, y : 0, z : 0};
s2.workingPosition = {x : 0, y : 0, z : 0};
assert(s1.equals(s2));


function test ( block: (next:Function) => void ) {
	var timer = setTimeout( () => {
		console.log('test timeout');
		assert(false);
		process.exit(1);
	}, 1000);

	block( () => {
		clearTimeout(timer);
	});
}

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
		if (d == "\x18") {
			this.mockResponse("Grbl 0.9j ['$' for help]\n");
		} else
		if (d == "?") {
			this.mockResponse("<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>\n");
		}
		this.written.unshift(d);
	}

	close(cb: (err: any) => void) {
		setTimeout(cb, 0);
	}

	mockResponse(d: string) {
		setTimeout( () => {
			this.emit("data", d);
		}, 0);
	}
}

var mock = new MockSerialPort();

var grbl = new Grbl(mock);

grbl.once('startup', (r) => {
	assert(r.version.major == 0.9);
	assert(r.version.minor == 'j');
});

Promise.resolve().
	then( ()=> {
		return grbl.open().then( () => {
			assert(grbl.isOpened);
			console.log('open');
		});
	}).
	then( ()=> {
		var promise = grbl.getConfig().then( (config) => {
			assert.deepEqual(config, [ { message: '$0=a' }, { message: '$1=b' } ]);
		});
		mock.mockResponse('$0=a\n');
		mock.mockResponse('$1=b\n');
		mock.mockResponse('ok\n');
		return promise;
	}).
	then( () => {
		return grbl.getStatus().then( (status) => {
			assert.deepEqual(status, { state: 'Idle',
				machinePosition: { x: 0, y: 0, z: 0 },
				workingPosition: { x: 0, y: 0, z: 0 } });
		});
	}).
	then( () => {
		var promise =  grbl.command("G01 X0.000 Y0.000 F500").then( () => {
			assert(true);
		});
		mock.mockResponse('ok\n');
		return promise;
	}).
	then( () => {
		var promise =  grbl.command("G01 X0.000 Y0.000 F500").then( () => {
			assert(false);
		}, (e) => {
			assert.deepEqual(e,  { message: 'test error' });
		});
		mock.mockResponse('error:test error\n');
		return promise;
	}).
	then( ()=> {
		return new Promise( (resolve, reject) => {
			grbl.once('alarm', (r) => {
				assert.deepEqual(r,  { message: 'TEST ALARM' });
				assert.deepEqual(grbl.lastAlarm,  { message: 'TEST ALARM' });
				resolve();
			});
			mock.mockResponse('ALARM:TEST ALARM\n');
		});
	}).
	then( ()=> {
		return new Promise( (resolve, reject) => {
			grbl.once('feedback', (r) => {
				assert.deepEqual(r,  { message: 'Enabled' });
				assert.deepEqual(grbl.lastFeedback,  { message: 'Enabled' });
				resolve();
			});
			mock.mockResponse('[Enabled]\n');
		});
	}).
	then( ()=> {
		console.log('close');
		return grbl.close();
	}).
	catch( (e) => {
		console.log(e);
		process.exit(1);
	});


grbl.on("statusupdate", (e) => {
});


