//#!tsc --target ES5 --module commonjs client.ts && node client.js

///<reference path="./typings/bundle.d.ts"/>

import * as websocket from 'websocket';
import events = require("events");

class GrblClient extends events.EventEmitter {
	client : websocket.client;
	connection: websocket.connection;
	id: number;
	requests: { [id: number ]: any };

	constructor() {
		super();
		this.client = new websocket.client();
		this.id = 0;
		this.requests = {};
	}

	connect(uri: string): GrblClient {
		this.client.connect(uri, null);
		this.client.on('connect', (connection) => {
			this.connection = connection;
			this.emit('connect');

			connection.on('message', (message) => {
				console.log(message.utf8Data);
				var data = JSON.parse(message.utf8Data);
				if (data.id) {
					try {
						if (data.hasOwnProperty('error')) {
							this.requests[data.id].reject(data.error);
						} else {
							this.requests[data.id].resolve(data.result);
						}
					} catch (e) {
						console.log(e);
					}
				}
			});

			this.request({ method: 'config' }).
				then( (config) => {
					console.log(config);
				});
			this.request({ method: 'gcode', params: {} }).
				then( (res) => {
					console.log('gcode res', res);
				});
			this.request({ method: 'command', params: { command: '$X' } }).
				then( (res) => {
					console.log('gcode res', res);
				});

			this.request({ method: 'gcode', params: {
				gcode : "G01 X0.000 Y0.000 F500\n"
			} }).
				then( (res) => {
					console.log('gcode res', res);
				});
		});

		this.client.on('connectFailed', (err) => {
			console.log(err);
			this.emit('error', err);
		});

		return this;
	}

	request(req: any):Promise<any> {
		return new Promise( (resolve, reject) => {
			var id = this.id++;
			this.requests[id] = {
				resolve: resolve,
				reject: reject,
			};
			this.connection.sendUTF(JSON.stringify({
				id: id,
				method: req.method,
				params: req.params,
			}));
		});
	}
}


var client = new GrblClient().connect('ws://localhost:8080');
