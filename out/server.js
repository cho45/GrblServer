//#!tsc --target ES5 --module commonjs server.ts && node server.js
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="./typings/bundle.d.ts"/>
///<reference path="./typings/serialport.d.ts" />
///<reference path="./typings/config.d.ts" />
///<reference path="./typings/node-static.d.ts" />
///<reference path="./typings/http2.ts" />
var websocket = require('websocket');
var grbl_1 = require('./grbl');
var http = require('http');
var http2 = require('http2');
var fs = require('fs');
var serialport = require("serialport");
var config = require("config");
var static = require("node-static");
;
var JSONRPCErrorParseError = {
    code: -32700,
    message: 'Parse Error'
};
var JSONRPCErrorInvalidRequest = {
    code: -32600,
    message: 'Invalid Request'
};
var JSONRPCErrorMethodNotFound = {
    code: -32601,
    message: 'Method not found'
};
var JSONRPCErrorInvalidParams = {
    code: -32602,
    message: 'Invalid params'
};
var JSONRPCErrorInternalError = {
    code: -32603,
    message: 'Internal error'
};
var JSONRPCErrorServerError = (function () {
    function JSONRPCErrorServerError(code, message, data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    return JSONRPCErrorServerError;
})();
var JSONRPCErrorGrblError = (function (_super) {
    __extends(JSONRPCErrorGrblError, _super);
    function JSONRPCErrorGrblError(data) {
        _super.call(this, -32000, "Error on grbl", data);
    }
    return JSONRPCErrorGrblError;
})(JSONRPCErrorServerError);
var JSONRPCErrorNotIdleError = (function (_super) {
    __extends(JSONRPCErrorNotIdleError, _super);
    function JSONRPCErrorNotIdleError(data) {
        _super.call(this, -32001, "Grbl state is not idle", data);
    }
    return JSONRPCErrorNotIdleError;
})(JSONRPCErrorServerError);
var GCode = (function () {
    function GCode(name, gcode) {
        this.startedTime = null;
        this.finishedTime = null;
        this.name = name;
        this.sent = [];
        this.remain = gcode.split(/\n/);
        this.total = this.remain.length;
        this.createdTime = new Date().getTime();
    }
    return GCode;
})();
var GrblServer = (function () {
    function GrblServer() {
    }
    GrblServer.prototype.start = function () {
        this.loadConfig();
        this.startHttp();
        this.startWebSocket();
        this.openSerialPort();
    };
    GrblServer.prototype.loadConfig = function () {
        this.serverConfig = {
            serverPort: config.get('serverPort'),
            serialPort: config.get('serialPort'),
            serialBaud: config.get('serialBaud'),
            TLSKey: config.get('TLSKey'),
            TLSCert: config.get('TLSCert'),
        };
        this.rev = fs.readFileSync('out/rev.txt', 'utf-8');
        console.log('Launching with this config: ');
        console.log(this.serverConfig);
    };
    GrblServer.prototype.startHttp = function () {
        var _this = this;
        var fileServer = new static.Server('./browser', {
            cache: 3600 * 24 * 30
        });
        var handler = function (req, res) {
            if (req.url === '/config') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(_this.serverConfig));
            }
            else {
                fileServer.serve(req, res);
            }
        };
        console.log('startHttp');
        this.httpServer = http.createServer(handler);
        this.httpServer.listen(this.serverConfig.serverPort, function () {
            console.log('Server is listening on port ' + _this.serverConfig.serverPort);
        });
        if (this.serverConfig.TLSKey) {
            this.http2Server = http2.createServer({
                key: fs.readFileSync(this.serverConfig.TLSKey),
                cert: fs.readFileSync(this.serverConfig.TLSCert)
            }, handler);
            var http2port = this.serverConfig.serverPort - 80 + 443;
            this.http2Server.listen(http2port, function () {
                console.log('Server is listening on port ' + http2port);
            });
        }
    };
    GrblServer.prototype.startWebSocket = function () {
        console.log('startWebSocket');
        this.sessions = [];
        this.wsServer = this._startWebSocket(this.httpServer);
        if (this.http2Server) {
            this.wssServer = this._startWebSocket(this.http2Server);
        }
    };
    GrblServer.prototype._startWebSocket = function (server) {
        var _this = this;
        var wsServer = new websocket.server({
            httpServer: server,
            maxReceivedFrameSize: 131072,
            maxReceivedMessageSize: 10 * 1024 * 1024,
            autoAcceptConnections: false
        });
        wsServer.on('request', function (req) {
            if (!req.remoteAddress.match(/^((::ffff:)?(127\.|10\.|192\.168\.)|::1)/)) {
                req.reject();
                console.log('Connection from origin ' + req.remoteAddress + ' rejected.');
                return;
            }
            var connection;
            try {
                connection = req.accept(null, req.origin);
            }
            catch (e) {
                console.log(e);
                return;
            }
            console.log('Connection accepted. from:' + req.remoteAddress + ' origin:' + req.origin);
            _this.sessions.push(connection);
            _this.sendInitialMessage(connection);
            connection.on('message', function (message) {
                console.log(message);
                try {
                    if (message.type !== 'utf8')
                        return;
                    console.log('Req: ' + message.utf8Data);
                    var req;
                    try {
                        req = JSON.parse(message.utf8Data);
                    }
                    catch (e) {
                        _this.sendMessage(connection, {
                            id: null,
                            error: JSONRPCErrorParseError,
                        });
                    }
                    console.log('request ', req.method);
                    var method = _this['service_' + req.method];
                    if (!method) {
                        _this.sendMessage(connection, {
                            id: req.id,
                            error: JSONRPCErrorMethodNotFound,
                        });
                    }
                    method.call(_this, req.params || {}).
                        then(function (result) {
                        _this.sendMessage(connection, {
                            id: req.id,
                            result: result || null
                        });
                    }, function (error) {
                        _this.sendMessage(connection, {
                            id: req.id,
                            error: error || null
                        });
                    });
                }
                catch (e) {
                    _this.sendMessage(connection, {
                        id: null,
                        error: JSONRPCErrorInternalError,
                    });
                }
            });
            connection.on('frame', function (frame) {
                console.log(frame);
            });
            connection.on('error', function (e) {
                console.log(e);
            });
            connection.on('close', function (reasonCode, description) {
                console.log('Peer ' + connection.remoteAddress + ' disconnected.', reasonCode, description);
                _this.sessions.splice(_this.sessions.indexOf(connection), 1);
                console.log(_this.sessions);
            });
        });
        return wsServer;
    };
    GrblServer.prototype.sendInitialMessage = function (connection) {
        this.sendMessage(connection, {
            id: null,
            result: {
                type: 'init',
                lastAlarm: this.grbl.lastAlarm ? this.grbl.lastAlarm.message : null,
                lastFeedback: this.grbl.lastFeedback ? this.grbl.lastFeedback.message : null,
                status: this.grbl.status,
                serverRev: this.rev,
                grblVersion: this.grblVersion,
            }
        });
        if (this.grblConfig) {
            this.sendMessage(connection, {
                id: null,
                result: {
                    type: 'config',
                    config: this.grblConfig
                }
            });
        }
        else {
            this.getConfig();
        }
        this.sendMessage(connection, {
            id: null,
            result: {
                type: 'gcode',
                gcode: this.gcode,
            }
        });
    };
    GrblServer.prototype.sendMessage = function (connection, response) {
        connection.sendUTF(JSON.stringify(response));
    };
    GrblServer.prototype.sendBroadcastMessage = function (message) {
        for (var i = 0, it = void 0; it = this.sessions[i]; i++) {
            this.sendMessage(it, message);
        }
    };
    GrblServer.prototype.service_upload = function (params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.gcode) {
                reject(new JSONRPCErrorNotIdleError(_this.grbl.status.state));
                return;
            }
            // load new gcode
            _this.gcode = new GCode(params.name, params.gcode);
            console.log('New gcode uploaded: ', _this.gcode.remain.length, 'lines');
            _this.sendBroadcastMessage({
                id: null,
                result: {
                    type: 'gcode',
                    gcode: _this.gcode,
                }
            });
            resolve();
        });
    };
    GrblServer.prototype.service_gcode = function (params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (params.execute) {
                _this.gcode.startedTime = new Date().getTime();
                _this.sendOneLine();
                _this.sendBroadcastMessage({
                    id: null,
                    result: {
                        type: 'gcode.start',
                        time: _this.gcode.startedTime,
                    }
                });
                resolve();
            }
            else if (params.clear) {
                _this.gcode = null;
                _this.sendBroadcastMessage({
                    id: null,
                    result: {
                        type: 'gcode',
                        gcode: _this.gcode,
                    }
                });
            }
            else {
                resolve({
                    type: 'gcode',
                    gcode: _this.gcode,
                });
            }
        });
    };
    GrblServer.prototype.service_config = function (params) {
        return Promise.resolve(this.grblConfig);
    };
    GrblServer.prototype.service_command = function (params) {
        if (params.command === '$$') {
            return this.getConfig();
        }
        else {
            return this.grbl.command(params.command);
        }
    };
    GrblServer.prototype.service_reset = function (params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.grbl.reset();
            resolve();
        });
    };
    GrblServer.prototype.service_resume = function (params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.grbl.realtimeCommand('~');
            resolve();
        });
    };
    GrblServer.prototype.service_pause = function (params) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.grbl.realtimeCommand('!');
            resolve();
        });
    };
    GrblServer.prototype.openSerialPort = function () {
        var _this = this;
        console.log('openSerialPort');
        var sp = new serialport.SerialPort(this.serverConfig.serialPort, {
            baudrate: this.serverConfig.serialBaud,
            parser: serialport.parsers.readline("\n")
        }, false);
        this.grbl = new grbl_1.Grbl(sp);
        this.grbl.open();
        this.grbl.on('startup', function (res) {
            _this.initializeGrbl();
            _this.grblVersion = res.version;
            _this.sendBroadcastMessage({
                id: null,
                result: res.toObject({
                    type: 'startup',
                    version: res.version,
                }),
            });
            _this.sendBroadcastMessage({
                id: null,
                result: {
                    type: 'gcode',
                    gcode: null,
                }
            });
        });
        this.grbl.on('statuschange', function (status) {
            console.log('statuschange');
            _this.sendBroadcastMessage({
                id: null,
                result: {
                    type: 'status',
                    status: status
                }
            });
        });
        this.grbl.on('alarm', function (res) {
            _this.sendBroadcastMessage({
                id: null,
                result: res.toObject({
                    type: 'alarm',
                }),
            });
        });
        this.grbl.on('feedback', function (res) {
            _this.sendBroadcastMessage({
                id: null,
                result: res.toObject({
                    type: 'feedback',
                }),
            });
        });
        this.grbl.on('error', function (e) {
            console.log('Error on grbl: ' + e);
            _this.sendBroadcastMessage({
                id: null,
                error: new JSONRPCErrorGrblError(e.message),
            });
            setTimeout(function () {
                _this.openSerialPort();
            }, 5000);
        });
    };
    GrblServer.prototype.destory = function () {
        this.grbl.close();
    };
    GrblServer.prototype.initializeGrbl = function () {
        this.gcode = null;
        this.getConfig();
    };
    GrblServer.prototype.getConfig = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.grbl.getConfig().
                then(function (res) {
                var results = {};
                for (var i = 0, it; (it = res[i]); i++) {
                    var match = it.raw.match(/([^=]+)=([^\s]+)/);
                    if (!match) {
                        console.log('unexpected line: ', it);
                        return;
                    }
                    results[match[1]] = match[2];
                }
                _this.grblConfig = results;
                _this.sendBroadcastMessage({
                    id: null,
                    result: {
                        type: 'config',
                        config: _this.grblConfig
                    }
                });
                resolve(res);
            }, function (e) {
            });
        });
    };
    GrblServer.prototype.sendOneLine = function () {
        var _this = this;
        if (!this.gcode) {
            return;
        }
        if (!this.gcode.remain.length) {
            this.gcode.finishedTime = new Date().getTime();
            // done
            this.sendBroadcastMessage({
                id: null,
                result: {
                    type: 'gcode.done',
                    time: this.gcode.finishedTime,
                }
            });
            return;
        }
        var code = this.gcode.remain.shift();
        this.gcode.sent.push(code);
        this.sendBroadcastMessage({
            id: null,
            result: {
                type: 'gcode.progress',
                gcode: code,
            }
        });
        this.grbl.command(code).
            then(function () {
            _this.sendOneLine();
        }, function (e) {
            _this.sendOneLine();
            console.log('Error on sending gcode:' + e);
            _this.sendBroadcastMessage({
                id: null,
                error: new JSONRPCErrorGrblError(e.message),
            });
        });
    };
    return GrblServer;
})();
new GrblServer().start();
