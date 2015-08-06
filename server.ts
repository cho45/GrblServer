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

	sent : Array<string>;
	remain: Array<string>;

	start() {
		this.loadConfig();
		this.startHttp();
		this.startWebSocket();
		// this.openSerialPort();
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

			connection.on('message', (message) => {
				if (message.type !== 'utf8') return;
				try {
					console.log('Req: ' + message.utf8Data);
					var data = JSON.parse(message.utf8Data);
					var method: string = data.method;
					var params: any = data.params;
					var id: number = data.id;
					var result = this['service_' + method](method, params);
					connection.sendUTF(JSON.stringify({
						id: id,
						result: result
					}));
				} catch (e) {
					console.log(e);
					connection.sendUTF(JSON.stringify({
						id: id,
						error: e
					}));
				}
			});

			connection.on('close', (reasonCode, description) => {
				console.log('Peer ' + connection.remoteAddress + ' disconnected.');
				this.sessions.splice(this.sessions.indexOf(connection), 1);
				console.log(this.sessions);
			});
		});
	}

	service_gcode(params: any): any {
		this.executeGcode(params.gcode);
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


	executeGcode(gcode: string) {
		if (this.remain.length) {
			throw "remain gcode is not empty";
		}
		this.sent = [];
		this.remain = gcode.split(/\n/);
		this.sendOneLine();
	}

	sendOneLine() {
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


