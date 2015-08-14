///<reference path="./typings/bundle.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
exports.STATE_IDLE = "Idle";
exports.STATE_RUN = "Run";
exports.STATE_HOLD = "Hold";
exports.STATE_HOME = "Home";
exports.STATE_ALARM = "Alerm";
exports.STATE_CHECK = "Check";
exports.STATE_DOOR = "Door";
var MESSAGE_STARTUP = /^Grbl (\d\.\d)(.)/;
var MESSAGE_OK = /^ok$/;
var MESSAGE_ERROR = /^error:(.+)$/;
var MESSAGE_ALARM = /^ALARM:(.+)$/;
var MESSAGE_FEEDBACK = /^\[(.+)\]$/;
var MESSAGE_STATUS = /^<(.+)>$/;
var MESSAGE_DOLLAR = /^\$/;
var GrblLineParserResult = (function () {
    function GrblLineParserResult(raw) {
        this.raw = raw;
    }
    GrblLineParserResult.prototype.toObject = function (copy) {
        var _this = this;
        var ret = {};
        Object.keys(this).forEach(function (key) {
            ret[key] = _this[key];
        });
        if (copy) {
            Object.keys(copy).forEach(function (key) {
                ret[key] = copy[key];
            });
        }
        return ret;
    };
    return GrblLineParserResult;
})();
exports.GrblLineParserResult = GrblLineParserResult;
var GrblLineParserResultStartup = (function (_super) {
    __extends(GrblLineParserResultStartup, _super);
    function GrblLineParserResultStartup() {
        _super.apply(this, arguments);
    }
    GrblLineParserResultStartup.parse = function (line) {
        if (!MESSAGE_STARTUP.test(line))
            return null;
        var ret = new this(line);
        ret.version = {
            major: +RegExp.$1,
            minor: RegExp.$2
        };
        return ret;
    };
    return GrblLineParserResultStartup;
})(GrblLineParserResult);
exports.GrblLineParserResultStartup = GrblLineParserResultStartup;
var GrblLineParserResultOk = (function (_super) {
    __extends(GrblLineParserResultOk, _super);
    function GrblLineParserResultOk() {
        _super.apply(this, arguments);
    }
    GrblLineParserResultOk.parse = function (line) {
        if (!MESSAGE_OK.test(line))
            return null;
        return new this(line);
    };
    return GrblLineParserResultOk;
})(GrblLineParserResult);
exports.GrblLineParserResultOk = GrblLineParserResultOk;
var GrblLineParserResultError = (function (_super) {
    __extends(GrblLineParserResultError, _super);
    function GrblLineParserResultError() {
        _super.apply(this, arguments);
    }
    GrblLineParserResultError.parse = function (line) {
        if (!MESSAGE_ERROR.test(line))
            return null;
        var ret = new this(line);
        ret.message = RegExp.$1;
        return ret;
    };
    return GrblLineParserResultError;
})(GrblLineParserResult);
exports.GrblLineParserResultError = GrblLineParserResultError;
var GrblLineParserResultAlarm = (function (_super) {
    __extends(GrblLineParserResultAlarm, _super);
    function GrblLineParserResultAlarm() {
        _super.apply(this, arguments);
    }
    GrblLineParserResultAlarm.parse = function (line) {
        if (!MESSAGE_ALARM.test(line))
            return null;
        var ret = new this(line);
        ret.message = RegExp.$1;
        return ret;
    };
    return GrblLineParserResultAlarm;
})(GrblLineParserResult);
exports.GrblLineParserResultAlarm = GrblLineParserResultAlarm;
var GrblLineParserResultFeedback = (function (_super) {
    __extends(GrblLineParserResultFeedback, _super);
    function GrblLineParserResultFeedback() {
        _super.apply(this, arguments);
    }
    GrblLineParserResultFeedback.parse = function (line) {
        if (!MESSAGE_FEEDBACK.test(line))
            return null;
        var ret = new this(line);
        ret.message = RegExp.$1;
        return ret;
    };
    return GrblLineParserResultFeedback;
})(GrblLineParserResult);
exports.GrblLineParserResultFeedback = GrblLineParserResultFeedback;
var GrblLineParserResultDollar = (function (_super) {
    __extends(GrblLineParserResultDollar, _super);
    function GrblLineParserResultDollar() {
        _super.apply(this, arguments);
    }
    GrblLineParserResultDollar.parse = function (line) {
        if (!MESSAGE_DOLLAR.test(line))
            return null;
        var ret = new this(line);
        return ret;
    };
    return GrblLineParserResultDollar;
})(GrblLineParserResult);
exports.GrblLineParserResultDollar = GrblLineParserResultDollar;
var GrblLineParserResultStatus = (function (_super) {
    __extends(GrblLineParserResultStatus, _super);
    function GrblLineParserResultStatus(raw) {
        _super.call(this, raw);
        this.state = exports.STATE_IDLE;
        this.machinePosition = { x: 0, y: 0, z: 0 };
        this.workingPosition = { x: 0, y: 0, z: 0 };
    }
    GrblLineParserResultStatus.parse = function (line) {
        if (!MESSAGE_STATUS.test(line))
            return null;
        var ret = new this(line);
        var params = RegExp.$1.split(/,/);
        ret.state = params.shift();
        var map = {};
        var current;
        for (var i = 0, len = params.length; i < len; i++) {
            var param = params[i];
            if (/^(.+):(.+)/.test(param)) {
                current = RegExp.$1;
                param = RegExp.$2;
                map[current] = new Array();
            }
            if (!current) {
                throw "Illegal status format: " + line;
            }
            map[current].push(param);
        }
        ret.machinePosition = {
            x: +map['MPos'][0],
            y: +map['MPos'][1],
            z: +map['MPos'][2]
        };
        ret.workingPosition = {
            x: +map['WPos'][0],
            y: +map['WPos'][1],
            z: +map['WPos'][2]
        };
        if (map.hasOwnProperty('Buf')) {
            ret.plannerBufferCount = +map['Buf'][0];
        }
        if (map.hasOwnProperty('RX')) {
            ret.rxBufferCount = +map['RX'][0];
        }
        return ret;
    };
    GrblLineParserResultStatus.prototype.equals = function (other) {
        var ret = this.state === other.state &&
            this.plannerBufferCount === other.plannerBufferCount &&
            this.rxBufferCount === other.rxBufferCount &&
            this.machinePosition.x === other.machinePosition.x &&
            this.machinePosition.y === other.machinePosition.y &&
            this.machinePosition.z === other.machinePosition.z &&
            this.workingPosition.x === other.workingPosition.x &&
            this.workingPosition.y === other.workingPosition.y &&
            this.workingPosition.z === other.workingPosition.z;
        return ret;
    };
    return GrblLineParserResultStatus;
})(GrblLineParserResult);
exports.GrblLineParserResultStatus = GrblLineParserResultStatus;
var GrblLineParser = (function () {
    function GrblLineParser() {
    }
    GrblLineParser.prototype.parse = function (line) {
        var parsers = [
            GrblLineParserResultStatus,
            GrblLineParserResultOk,
            GrblLineParserResultError,
            GrblLineParserResultAlarm,
            GrblLineParserResultFeedback,
            GrblLineParserResultDollar,
            GrblLineParserResultStartup
        ];
        for (var i = 0, it = void 0; (it = parsers[i]); i++) {
            var result = it.parse(line);
            if (result) {
                return result;
            }
        }
        // console.log("unknown message: " + line);
        return null;
    };
    return GrblLineParser;
})();
exports.GrblLineParser = GrblLineParser;
var events = require("events");
var Grbl = (function (_super) {
    __extends(Grbl, _super);
    function Grbl(serialport) {
        _super.call(this);
        this.status = new GrblLineParserResultStatus(null);
        this.serialport = serialport;
        this.parser = new GrblLineParser();
        this.isOpened = false;
        this.waitingQueue = [];
        this.DEBUG = false;
    }
    Grbl.prototype.open = function () {
        var _this = this;
        this.on("startup", function (r) {
            _this.waitingQueue = [];
            _this.stopQueryStatus();
            _this.realtimeCommand("?");
            _this.startQueryStatus();
        });
        return new Promise(function (resolve, reject) {
            _this.serialport.open(function (err) {
                if (err) {
                    _this.emit('error', 'error on opening serialport');
                    reject(err);
                    return;
                }
                _this.isOpened = true;
                _this.reset();
                _this.serialport.on("data", function (data) {
                    _this.processData(data);
                });
                _this.serialport.on("close", function () {
                    if (!_this.isClosing) {
                        _this.emit('error', 'unexpected close on the serialport');
                    }
                    _this.destroy();
                });
                _this.serialport.on("error", function (err) {
                    _this.emit('error', 'unexpected error on the serialport');
                    _this.destroy();
                });
                _this.once("startup", function (r) {
                    resolve();
                });
            });
        });
    };
    Grbl.prototype.startQueryStatus = function () {
        var _this = this;
        this.statusQueryTimer = setTimeout(function () {
            _this.getStatus();
            if (_this.isOpened) {
                _this.startQueryStatus();
            }
        }, 1 / 10 * 1000);
    };
    Grbl.prototype.stopQueryStatus = function () {
        clearTimeout(this.statusQueryTimer);
        this.statusQueryTimer = null;
    };
    Grbl.prototype.close = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.isClosing = true;
            _this.reset();
            _this.serialport.close(function (err) {
                if (err)
                    reject(err);
                _this.destroy();
                resolve();
            });
        });
    };
    Grbl.prototype.destroy = function () {
        if (this.isOpened) {
            this.isOpened = false;
            this.stopQueryStatus();
        }
    };
    Grbl.prototype.getConfig = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.status.state != exports.STATE_IDLE) {
                reject('Must called in idle state');
            }
            var results = [];
            var listener = function (e) {
                results.push(e);
            };
            _this.on("dollar", listener);
            _this.command("$$").
                then(function () {
                _this.removeListener("dollar", listener);
                resolve(results);
            }, reject);
        });
    };
    Grbl.prototype.getStatus = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.status.state !== exports.STATE_ALARM &&
                _this.status.state !== exports.STATE_HOME) {
                _this.once("status", function (res) {
                    resolve(res);
                });
                _this.realtimeCommand("?");
            }
            else {
                reject("state is alarm or homing");
            }
        });
    };
    Grbl.prototype.command = function (cmd) {
        var _this = this;
        var ret = new Promise(function (resolve, reject) {
            if (_this.DEBUG)
                console.log('>>', cmd);
            _this.serialport.write(cmd + '\n');
            _this.waitingQueue.push(function (err) {
                if (err)
                    return reject(err);
                resolve();
            });
        });
        if (cmd === '$H') {
            // command "?" is not usable in homing
            var prevState = this.status.state;
            this.status.state = exports.STATE_HOME;
            this.stopQueryStatus();
            this.emit("statuschange", this.status);
            this.emit("status", this.status);
            ret = ret.then(function () {
                _this.status.state = prevState;
                _this.startQueryStatus();
            });
        }
        return ret;
    };
    Grbl.prototype.realtimeCommand = function (cmd) {
        this.serialport.write(cmd);
    };
    Grbl.prototype.reset = function () {
        this.realtimeCommand("\x18");
    };
    Grbl.prototype.processData = function (data) {
        data = data.replace(/\s+$/, '');
        if (this.DEBUG)
            console.log('<<', data);
        if (!data)
            return;
        this.emit("raw", data);
        var result = this.parser.parse(data);
        if (!result)
            return;
        this.emit("response", result);
        if (result instanceof GrblLineParserResultStatus) {
            if (!this.status.equals(result)) {
                this.emit("statuschange", result);
            }
            this.status = result;
            this.emit("status", result);
        }
        else if (result instanceof GrblLineParserResultOk) {
            // callback maybe null after reseting
            var callback = this.waitingQueue.shift();
            if (callback)
                callback(null);
        }
        else if (result instanceof GrblLineParserResultError) {
            // callback maybe null after reseting
            var callback = this.waitingQueue.shift();
            if (callback)
                callback(result);
        }
        else if (result instanceof GrblLineParserResultStartup) {
            this.emit("startup", result);
        }
        else if (result instanceof GrblLineParserResultAlarm) {
            // command "?" is not usable in alarm,
            // so set state by hand
            this.status.state = exports.STATE_ALARM;
            this.lastAlarm = result;
            this.emit("alarm", result);
            this.emit("statuschange", this.status);
            this.emit("status", this.status);
        }
        else if (result instanceof GrblLineParserResultFeedback) {
            this.lastFeedback = result;
            this.emit("feedback", result);
        }
        else if (result instanceof GrblLineParserResultDollar) {
            this.emit("dollar", result);
        }
    };
    return Grbl;
})(events.EventEmitter);
exports.Grbl = Grbl;
