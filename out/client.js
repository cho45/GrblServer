//#!tsc --target ES5 --module commonjs client.ts && node client.js
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="./typings/bundle.d.ts"/>
var websocket = require('websocket');
var events = require("events");
var GrblClient = (function (_super) {
    __extends(GrblClient, _super);
    function GrblClient() {
        _super.call(this);
        this.client = new websocket.client();
        this.id = 0;
        this.requests = {};
    }
    GrblClient.prototype.connect = function (uri) {
        var _this = this;
        this.client.connect(uri, null);
        this.client.on('connect', function (connection) {
            _this.connection = connection;
            _this.emit('connect');
            connection.on('message', function (message) {
                console.log(message.utf8Data);
                var data = JSON.parse(message.utf8Data);
                if (data.id) {
                    try {
                        if (data.hasOwnProperty('error')) {
                            _this.requests[data.id].reject(data.error);
                        }
                        else {
                            _this.requests[data.id].resolve(data.result);
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
            });
            _this.request({ method: 'config' }).
                then(function (config) {
                console.log(config);
            });
            _this.request({ method: 'gcode', params: {} }).
                then(function (res) {
                console.log('gcode res', res);
            });
            _this.request({ method: 'command', params: { command: '$X' } }).
                then(function (res) {
                console.log('gcode res', res);
            });
            _this.request({ method: 'gcode', params: {
                    gcode: "G01 X0.000 Y0.000 F500\n"
                } }).
                then(function (res) {
                console.log('gcode res', res);
            });
        });
        this.client.on('connectFailed', function (err) {
            console.log(err);
            _this.emit('error', err);
        });
        return this;
    };
    GrblClient.prototype.request = function (req) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var id = _this.id++;
            _this.requests[id] = {
                resolve: resolve,
                reject: reject,
            };
            _this.connection.sendUTF(JSON.stringify({
                id: id,
                method: req.method,
                params: req.params,
            }));
        });
    };
    return GrblClient;
})(events.EventEmitter);
var client = new GrblClient().connect('ws://localhost:8080');
