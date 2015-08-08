//#!tsc --target ES5 --module commonjs server.ts && node server.js

///<reference path="./typings/bundle.d.ts"/>
///<reference path="./typings/serialport.d.ts" />
///<reference path="./typings/config.d.ts" />

import * as websocket from 'websocket';
import {Grbl} from './grbl';
import http = require('http');
import serialport = require("serialport");
import config = require("config");

interface GrblServerConfig {
	serialPort: string;
	serialBaud: number;
	serverPort: number;
};

interface JSONRPCRequest {
	method: string;
	params: any;
	id: number;
}

interface JSONRPCResponse {
	result?: any;
	error?: JSONRPCError;
	id: number;
}

interface JSONRPCError {
	code: number;
	message?: string;
	data?: any;
}

const JSONRPCErrorParseError = <JSONRPCError>{
	code: -32700,
	message: 'Parse Error'
};
const JSONRPCErrorInvalidRequest = <JSONRPCError>{
	code: -32600,
	message: 'Invalid Request'
};
const JSONRPCErrorMethodNotFound = <JSONRPCError>{
	code: -32601,
	message: 'Method not found'
};
const JSONRPCErrorInvalidParams = <JSONRPCError>{
	code: -32602,
	message: 'Invalid params'
};
const JSONRPCErrorInternalError = <JSONRPCError>{
	code: -32603,
	message: 'Internal error'
};

class JSONRPCErrorServerError implements JSONRPCError {
	code: number; /* -32000 to -32099 */
	message: string;
	data: any;
	constructor(code: number, message: string, data: any) {
		this.code = code;
		this.message = message;
		this.data = data;
	}
}

class JSONRPCErrorGrblError extends JSONRPCErrorServerError {
	constructor(data: any) {
		super(-32000, "Error on grbl", data);
	}
}

class JSONRPCErrorRemainGcode extends JSONRPCErrorServerError {
	constructor(data: any) {
		super(-32001, "Server gcode is not empty", data);
	}
}

class GrblServer {
	httpServer : http.Server;
	wsServer : websocket.server;
	sessions : Array<websocket.connection>;
	grbl : Grbl;
	config: GrblServerConfig;

	canceling: boolean;
	sent : Array<string>;
	remain: Array<string>;

	start() {
		this.loadConfig();
		this.startHttp();
		this.startWebSocket();
		this.openSerialPort();
	}

	loadConfig() {
		this.config = <GrblServerConfig>{
			serverPort: config.get('serverPort'),
			serialPort: config.get('serialPort'),
			serialBaud: config.get('serialBaud'),
		};
		console.log('Launching with this config: ');
		console.log(this.config);
	}

	startHttp() {
		console.log('startHttp');
		this.httpServer = http.createServer( (req, res) => {
			console.log(req.url);
			res.writeHead(404);
			res.end();
		});

		this.httpServer.listen(this.config.serverPort, () => {
			console.log('Server is listening on port ' + this.config.serverPort);
		});
	}

	startWebSocket() {
		console.log('startWebSocket');
		this.sessions = [];

		this.wsServer = new websocket.server({
			httpServer: this.httpServer,
			autoAcceptConnections: false
		});

		this.wsServer.on('request', (req) => {
			if (!req.remoteAddress.match(/^((::ffff:)?(127\.|10\.|192\.168\.)|::1)/)) {
				req.reject();
				console.log('Connection from origin ' + req.remoteAddress + ' rejected.');
				return;
			}

			var connection: websocket.connection;
			try {
				connection = req.accept(null, req.origin);
			} catch (e) {
				console.log(e);
				return;
			}
			console.log('Connection accepted. from:' + req.remoteAddress + ' origin:' + req.origin);

			this.sessions.push(connection);

			this.sendInitialMessage(connection);

			connection.on('message', (message) => {
				try {
					if (message.type !== 'utf8') return;
					console.log('Req: ' + message.utf8Data);
					var req: JSONRPCRequest;
					try {
						req = JSON.parse(message.utf8Data);
					} catch (e) {
						this.sendMessage(connection, {
							id: null,
							error: JSONRPCErrorParseError,
						});
					}

					var method = this['service_' + req.method];
					if (!method) {
						this.sendMessage(connection, {
							id: req.id,
							error: JSONRPCErrorMethodNotFound,
						});
					}

					method.call(this, req.params || {}).
						then( (result) => {
							this.sendMessage(connection, {
								id: req.id,
								result: result || null
							});
						}, (error: JSONRPCErrorServerError) => {
							this.sendMessage(connection, {
								id: req.id,
								error: error || null
							});
						});
				} catch (e) {
					this.sendMessage(connection, {
						id: null,
						error: JSONRPCErrorInternalError,
					});
				}
			});

			connection.on('close', (reasonCode, description) => {
				console.log('Peer ' + connection.remoteAddress + ' disconnected.');
				this.sessions.splice(this.sessions.indexOf(connection), 1);
				console.log(this.sessions);
			});
		});
	}

	sendInitialMessage(connection: websocket.connection) {
		this.sendMessage(connection, {
			id: null,
			result: {
				type: 'init',
				lastAlarm: this.grbl.lastAlarm ? this.grbl.lastAlarm.message : null,
				lastFeedback: this.grbl.lastFeedback ? this.grbl.lastFeedback.message : null,
				status: this.grbl.status,
			}
		});
	}

	sendMessage(connection: websocket.connection, response: JSONRPCResponse) {
		connection.sendUTF(JSON.stringify(response));
	}

	sendBroadcastMessage(message: any) {
		for (let i = 0, it: websocket.connection; it = this.sessions[i]; i++) {
			this.sendMessage(it, message);
		}
	}

	service_gcode(params: any): Promise<any> {
		return new Promise( (resolve, reject) => {
			if (params.gcode) {
				if (this.remain.length) {
					reject(new JSONRPCErrorRemainGcode(''));
					return;
				}

				this.sent = [];
				this.remain = params.gcode.split(/\n/);

				this.sendBroadcastMessage({
					id: null,
					result: {
						type: 'gcode',
						sent: this.sent,
						remain: this.remain,
					}
				});

				this.sendOneLine();
				resolve();
			} else {
				resolve({
					type: 'gcode',
					sent: this.sent,
					remain: this.remain,
				});
			}
		});
	}

	service_config(params: any): Promise<any> {
		return new Promise( (resolve, reject) => {
			this.grbl.getConfig().
				then(resolve, reject);
		});
	}

	service_command(params: any): Promise<any> {
		return this.grbl.command(params.command);
	}

	service_reset(params: any): Promise<any> {
		return new Promise( (resolve, reject) => {
			this.grbl.reset();
			resolve();
		});
	}

	service_resume(params: any): Promise<any> {
		return new Promise( (resolve, reject) => {
			this.grbl.realtimeCommand('~');
			resolve();
		});
	}

	service_pause(params: any): Promise<any> {
		return new Promise( (resolve, reject) => {
			this.grbl.realtimeCommand('!');
			resolve();
		});
	}

	openSerialPort() {
		console.log('openSerialPort');
		var sp = new serialport.SerialPort(this.config.serialPort, {
			baudrate: this.config.serialBaud,
			parser: serialport.parsers.readline("\n")
		}, false);

		this.grbl = new Grbl(sp);
		this.grbl.open();

		this.grbl.on('startup', (res) => {
			this.initializeGrbl();
			this.sendBroadcastMessage({
				id: null,
				result: {
					type: 'startup',
					version: res.version,
				}
			});
		});

		this.grbl.on('statuschange', (status) => {
			console.log('statuschange');
			this.sendBroadcastMessage({
				id: null,
				result: {
					type: 'status',
					status: status
				}
			});
		});

		this.grbl.on('alarm', (res) => {
			this.sendBroadcastMessage({
				id: null,
				result: {
					type: 'alarm',
					message: res.message,
				}
			});
		});

		this.grbl.on('feedback', (res) => {
			this.sendBroadcastMessage({
				id: null,
				result: {
					type: 'feedback',
					message: res.message,
				}
			});
		});

		this.grbl.on('error', (e) => {
			console.log('Error on grbl: ' + e);
			this.sendBroadcastMessage({
				id: null,
				error: new JSONRPCErrorGrblError(e),
			});
			setTimeout( () => {
				this.openSerialPort();
			}, 5000);
		});
	}

	destory() {
		this.grbl.close();
	}

	initializeGrbl() {
		this.sent = [];
		this.remain = [];
		this.grbl.getConfig().
			then( (res) => {
				console.log(res);
			}, (e) => {
			});
	}

	sendOneLine() {
		if (this.canceling) {
			this.canceling = false;
			return;
		}

		if (!this.remain.length) {
			// done
			this.sendBroadcastMessage({
				id: null,
				result: {
					type: 'done'
				}
			});
			return;
		}
		var code = this.remain.shift();
		this.sent.push(code);
			this.sendBroadcastMessage({
				id: null,
				result: {
					type: 'gcode',
					gcode: code,
				}
			});
		this.grbl.command(code).
			then( () => {
				this.sendOneLine();
			}, (e) => {
				console.log('Error on sending gcode:' + e);
				this.sendBroadcastMessage({
					id: null,
					error: new JSONRPCErrorGrblError(e),
				});
			});
	}
}

new GrblServer().start();


