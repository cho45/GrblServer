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
    function GrblLineParserResult() {
    }
    return GrblLineParserResult;
})();
exports.GrblLineParserResult = GrblLineParserResult;
var GrblLineParserResultStartup = (function (_super) {
    __extends(GrblLineParserResultStartup, _super);
    function GrblLineParserResultStartup(version) {
        _super.call(this);
        this.version = version;
    }
    return GrblLineParserResultStartup;
})(GrblLineParserResult);
exports.GrblLineParserResultStartup = GrblLineParserResultStartup;
var GrblLineParserResultOk = (function (_super) {
    __extends(GrblLineParserResultOk, _super);
    function GrblLineParserResultOk() {
        _super.apply(this, arguments);
    }
    return GrblLineParserResultOk;
})(GrblLineParserResult);
exports.GrblLineParserResultOk = GrblLineParserResultOk;
var GrblLineParserResultError = (function (_super) {
    __extends(GrblLineParserResultError, _super);
    function GrblLineParserResultError(message) {
        _super.call(this);
        this.message = message;
    }
    return GrblLineParserResultError;
})(GrblLineParserResult);
exports.GrblLineParserResultError = GrblLineParserResultError;
var GrblLineParserResultAlarm = (function (_super) {
    __extends(GrblLineParserResultAlarm, _super);
    function GrblLineParserResultAlarm(message) {
        _super.call(this);
        this.message = message;
    }
    return GrblLineParserResultAlarm;
})(GrblLineParserResult);
exports.GrblLineParserResultAlarm = GrblLineParserResultAlarm;
var GrblLineParserResultFeedback = (function (_super) {
    __extends(GrblLineParserResultFeedback, _super);
    function GrblLineParserResultFeedback(message) {
        _super.call(this);
        this.message = message;
    }
    return GrblLineParserResultFeedback;
})(GrblLineParserResult);
exports.GrblLineParserResultFeedback = GrblLineParserResultFeedback;
var GrblLineParserResultDollar = (function (_super) {
    __extends(GrblLineParserResultDollar, _super);
    function GrblLineParserResultDollar(message) {
        _super.call(this);
        this.message = message;
    }
    return GrblLineParserResultDollar;
})(GrblLineParserResult);
exports.GrblLineParserResultDollar = GrblLineParserResultDollar;
var GrblLineParserResultStatus = (function (_super) {
    __extends(GrblLineParserResultStatus, _super);
    function GrblLineParserResultStatus() {
        _super.apply(this, arguments);
    }
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
            this.parseStatus,
            this.parseOk,
            this.parseError,
            this.parseAlarm,
            this.parseFeedback,
            this.parseDollar,
            this.parseStartup
        ];
        for (var i = 0, it = void 0; (it = parsers[i]); i++) {
            var result = it.call(this, line);
            if (result) {
                return result;
            }
        }
        console.log("unknown message: " + line);
        return null;
    };
    GrblLineParser.prototype.parseStartup = function (line) {
        if (!MESSAGE_STARTUP.test(line))
            return false;
        return new GrblLineParserResultStartup({
            major: +RegExp.$1,
            minor: RegExp.$2
        });
    };
    GrblLineParser.prototype.parseOk = function (line) {
        if (!MESSAGE_OK.test(line))
            return false;
        return new GrblLineParserResultOk();
    };
    GrblLineParser.prototype.parseError = function (line) {
        if (!MESSAGE_ERROR.test(line))
            return false;
        return new GrblLineParserResultError(RegExp.$1);
    };
    GrblLineParser.prototype.parseAlarm = function (line) {
        if (!MESSAGE_ALARM.test(line))
            return false;
        return new GrblLineParserResultAlarm(RegExp.$1);
    };
    GrblLineParser.prototype.parseFeedback = function (line) {
        if (!MESSAGE_FEEDBACK.test(line))
            return false;
        return new GrblLineParserResultFeedback(RegExp.$1);
    };
    GrblLineParser.prototype.parseDollar = function (line) {
        if (!MESSAGE_DOLLAR.test(line))
            return false;
        return new GrblLineParserResultDollar(line);
    };
    GrblLineParser.prototype.parseStatus = function (line) {
        if (!MESSAGE_STATUS.test(line))
            return false;
        var ret = new GrblLineParserResultStatus();
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
        if (map['Buf']) {
            ret.plannerBufferCount = +map['Buf'][0];
        }
        if (map['RX']) {
            ret.rxBufferCount = +map['RX'][0];
        }
        return ret;
    };
    return GrblLineParser;
})();
exports.GrblLineParser = GrblLineParser;
var events = require("events");
var Grbl = (function (_super) {
    __extends(Grbl, _super);
    function Grbl(serialport) {
        _super.call(this);
        this.status = new GrblLineParserResultStatus();
        this.serialport = serialport;
        this.parser = new GrblLineParser();
        this.isOpened = false;
        this.waitingQueue = [];
    }
    Grbl.prototype.open = function () {
        var _this = this;
        this.on("startup", function (r) {
            _this.waitingQueue = [];
            _this.realtimeCommand("?");
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
                _this.startTimer();
                _this.once("startup", function (r) {
                    resolve();
                });
            });
        });
    };
    Grbl.prototype.startTimer = function () {
        var _this = this;
        this.timer = setTimeout(function () {
            _this.getStatus();
            if (_this.isOpened) {
                _this.startTimer();
            }
        }, 1 / 10 * 1000);
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
            clearTimeout(this.timer);
        }
    };
    Grbl.prototype.getConfig = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.status.state != exports.STATE_IDLE) {
                reject('Must called in idle state');
            }
            var results = [];
            var listener;
            listener = function (e) {
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
            if (_this.status.state !== exports.STATE_ALARM) {
                _this.once("status", function (res) {
                    resolve(res);
                });
                _this.realtimeCommand("?");
            }
            else {
                reject();
            }
        });
    };
    Grbl.prototype.command = function (cmd) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            console.log('>>', cmd);
            _this.serialport.write(cmd + '\n');
            _this.waitingQueue.push(function (err) {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    };
    Grbl.prototype.realtimeCommand = function (cmd) {
        this.serialport.write(cmd);
    };
    Grbl.prototype.reset = function () {
        this.realtimeCommand("\x18");
    };
    Grbl.prototype.processData = function (data) {
        data = data.replace(/\s+$/, '');
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
            this.lastAlarm = result;
            this.status.state = exports.STATE_ALARM;
            this.emit("alarm", result);
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
