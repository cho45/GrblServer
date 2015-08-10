//#!tsc --target ES5 --module commonjs test.ts && node test.js
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var grbl_1 = require("./grbl");
var assert = require('assert');
var parser = new grbl_1.GrblLineParser();
var result;
result = parser.parse("Grbl 0.9j ['$' for help]");
assert(result instanceof grbl_1.GrblLineParserResultStartup);
assert(result.version.major == '0.9');
assert(result.version.minor == 'j');
result = parser.parse("Grbl 0.9 ['$' for help]");
assert(result instanceof grbl_1.GrblLineParserResultStartup);
assert(result.version.major == '0.9');
assert(result.version.minor == ' ');
result = parser.parse("Grbl 0.51 ['$' for help]");
assert(result instanceof grbl_1.GrblLineParserResultStartup);
assert(result.version.major == '0.5');
assert(result.version.minor == '1');
result = parser.parse("<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>");
assert(result instanceof grbl_1.GrblLineParserResultStatus);
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
assert(result instanceof grbl_1.GrblLineParserResultStatus);
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
assert(result instanceof grbl_1.GrblLineParserResultStatus);
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
assert(result instanceof grbl_1.GrblLineParserResultFeedback);
assert(result.message == 'Reset to continue');
result = parser.parse("['$H'|'$X' to unlock]");
assert(result instanceof grbl_1.GrblLineParserResultFeedback);
result = parser.parse("[Caution: Unlocked]");
assert(result instanceof grbl_1.GrblLineParserResultFeedback);
result = parser.parse("[Enabled]");
assert(result instanceof grbl_1.GrblLineParserResultFeedback);
result = parser.parse("[Disabled]");
assert(result instanceof grbl_1.GrblLineParserResultFeedback);
result = parser.parse("ALARM:Hard/soft limit");
assert(result instanceof grbl_1.GrblLineParserResultAlarm);
assert(result.message == 'Hard/soft limit');
result = parser.parse("ALARM:Abort during cycle");
assert(result instanceof grbl_1.GrblLineParserResultAlarm);
result = parser.parse("ALARM:Probe fail");
assert(result instanceof grbl_1.GrblLineParserResultAlarm);
result = parser.parse("error:Invalid gcode ID:XX");
assert(result instanceof grbl_1.GrblLineParserResultError);
assert(result.message == 'Invalid gcode ID:XX');
result = parser.parse("$20=1");
assert(result instanceof grbl_1.GrblLineParserResultDollar);
assert(result.message == '$20=1');
var s1 = new grbl_1.GrblLineParserResultStatus();
s1.state = 'Idle';
s1.machinePosition = { x: 0, y: 0, z: 0 };
s1.workingPosition = { x: 0, y: 0, z: 0 };
var s2 = new grbl_1.GrblLineParserResultStatus();
s2.state = 'Idle';
s2.machinePosition = { x: 0, y: 0, z: 0 };
s2.workingPosition = { x: 0, y: 0, z: 0 };
assert(s1.equals(s2));
function test(block) {
    var timer = setTimeout(function () {
        console.log('test timeout');
        assert(false);
        process.exit(1);
    }, 1000);
    block(function () {
        clearTimeout(timer);
    });
}
var events = require("events");
var MockSerialPort = (function (_super) {
    __extends(MockSerialPort, _super);
    function MockSerialPort() {
        _super.call(this);
        this.written = [];
    }
    MockSerialPort.prototype.open = function (cb) {
        setTimeout(cb, 0);
    };
    MockSerialPort.prototype.write = function (d, cb) {
        if (d == "\x18") {
            this.mockResponse("Grbl 0.9j ['$' for help]\n");
        }
        else if (d == "?") {
            this.mockResponse("<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>\n");
        }
        this.written.unshift(d);
    };
    MockSerialPort.prototype.close = function (cb) {
        setTimeout(cb, 0);
    };
    MockSerialPort.prototype.mockResponse = function (d) {
        var _this = this;
        setTimeout(function () {
            _this.emit("data", d);
        }, 0);
    };
    return MockSerialPort;
})(events.EventEmitter);
var mock = new MockSerialPort();
var grbl = new grbl_1.Grbl(mock);
grbl.once('startup', function (r) {
    assert(r.version.major == 0.9);
    assert(r.version.minor == 'j');
});
Promise.resolve().
    then(function () {
    return grbl.open().then(function () {
        assert(grbl.isOpened);
        console.log('open');
    });
}).
    then(function () {
    var promise = grbl.getConfig().then(function (config) {
        assert.deepEqual(config, [{ message: '$0=a' }, { message: '$1=b' }]);
    });
    mock.mockResponse('$0=a\n');
    mock.mockResponse('$1=b\n');
    mock.mockResponse('ok\n');
    return promise;
}).
    then(function () {
    return grbl.getStatus().then(function (status) {
        assert.deepEqual(status, { state: 'Idle',
            machinePosition: { x: 0, y: 0, z: 0 },
            workingPosition: { x: 0, y: 0, z: 0 } });
    });
}).
    then(function () {
    var promise = grbl.command("G01 X0.000 Y0.000 F500").then(function () {
        assert(true);
    });
    mock.mockResponse('ok\n');
    return promise;
}).
    then(function () {
    var promise = grbl.command("G01 X0.000 Y0.000 F500").then(function () {
        assert(false);
    }, function (e) {
        assert.deepEqual(e, { message: 'test error' });
    });
    mock.mockResponse('error:test error\n');
    return promise;
}).
    then(function () {
    return new Promise(function (resolve, reject) {
        grbl.once('alarm', function (r) {
            assert.deepEqual(r, { message: 'TEST ALARM' });
            assert.deepEqual(grbl.lastAlarm, { message: 'TEST ALARM' });
            resolve();
        });
        mock.mockResponse('ALARM:TEST ALARM\n');
    });
}).
    then(function () {
    return new Promise(function (resolve, reject) {
        grbl.once('feedback', function (r) {
            assert.deepEqual(r, { message: 'Enabled' });
            assert.deepEqual(grbl.lastFeedback, { message: 'Enabled' });
            resolve();
        });
        mock.mockResponse('[Enabled]\n');
    });
}).
    then(function () {
    console.log('close');
    return grbl.close();
}).
    catch(function (e) {
    console.log(e);
    process.exit(1);
});
grbl.on("statusupdate", function (e) {
});
