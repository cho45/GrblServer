//#!tsc --target ES5 --module commonjs server.ts && node server.js

///<reference path="./typings/bundle.d.ts"/>
///<reference path="./typings/serialport.d.ts" />

import * as websocket from 'websocket';
import {Grbl} from './grbl';
import http = require('http');
import serialport = require("serialport");

interface GrblServerConfig {
	serialPort: string;
	serialBaud: number;
	serverPort: number;
};

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
			serverPort: 8080,
			serialPort: '/dev/tty.usbserial-AL011AVX',
			serialBaud: 115200,
		};
	}

	startHttp() {
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

			connection.sendUTF(JSON.stringify({
				id: null,
				result: {
					type: 'init',
					lastAlarm: this.grbl.lastAlarm ? this.grbl.lastAlarm.message : null,
					lastFeedback: this.grbl.lastFeedback ? this.grbl.lastFeedback.message : null,
					status: this.grbl.status,
				}
			}));

			connection.on('message', (message) => {
				if (message.type !== 'utf8') return;
				console.log('Req: ' + message.utf8Data);
				var data = JSON.parse(message.utf8Data);
				var method: string = data.method;
				var params: any = data.params || {};
				var id: number = data.id;
				this['service_' + method](params).
					then( (result) => {
						connection.sendUTF(JSON.stringify({
							id: id,
							result: result
						}));
					}, (error) => {
						connection.sendUTF(JSON.stringify({
							id: id,
							error: error
						}));
					});
			});

			connection.on('close', (reasonCode, description) => {
				console.log('Peer ' + connection.remoteAddress + ' disconnected.');
				this.sessions.splice(this.sessions.indexOf(connection), 1);
				console.log(this.sessions);
			});
		});
	}

	service_gcode(params: any): Promise<any> {
		return new Promise( (resolve, reject) => {
			if (params.gcode) {
				this.executeGcode(params.gcode);
				this.broadcast({
					id: null,
					result: {
						type: 'gcode',
						sent: this.sent,
						remain: this.remain,
					}
				});
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

	broadcast(message: any) {
		for (let i = 0, it: websocket.connection; it = this.sessions[i]; i++) {
			it.sendUTF(JSON.stringify(message));
		}
	}

	openSerialPort() {
		var sp = new serialport.SerialPort(this.config.serialPort, {
			baudrate: this.config.serialBaud,
			parser: serialport.parsers.readline("\n")
		}, false);

		this.grbl = new Grbl(sp);
		this.grbl.open();

		this.grbl.on('startup', (res) => {
			this.initializeGrbl();
			this.broadcast({
				id: null,
				result: {
					type: 'startup',
					version: res.version,
				}
			});
		});

		this.grbl.on('statuschange', (status) => {
			console.log('statuschange');
			this.broadcast({
				id: null,
				result: {
					type: 'status',
					status: status
				}
			});
		});

		this.grbl.on('alarm', (res) => {
			this.broadcast({
				id: null,
				result: {
					type: 'alarm',
					message: res.message,
				}
			});
		});

		this.grbl.on('feedback', (res) => {
			this.broadcast({
				id: null,
				result: {
					type: 'feedback',
					message: res.message,
				}
			});
		});

		this.grbl.on('error', (e) => {
			console.log('Error on grbl: ' + e);
			this.broadcast({
				id: null,
				error: e
			});
			setTimeout( () => {
				this.openSerialPort();
			}, 1000);
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

	executeGcode(gcode: string) {
		console.log('executeGcode');
		if (this.remain.length) {
			throw "remain gcode is not empty";
		}
		this.sent = [];
		this.remain = gcode.split(/\n/);
		this.sendOneLine();
	}

	sendOneLine() {
		if (this.canceling) {
			this.canceling = false;
			return;
		}

		if (!this.remain.length) {
			// done
			this.broadcast({
				id: null,
				result: {
					type: 'done'
				}
			});
			return;
		}
		var code = this.remain.shift();
		this.sent.push(code);
			this.broadcast({
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
				this.broadcast({
					id: null,
					error: e
				});
			});
	}
}

new GrblServer().start();


