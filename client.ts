///<reference path="./typings/bundle.d.ts"/>

import * as websocket from 'websocket';

var client = new websocket.client();
client.connect('ws://localhost:8080', null);
client.on('connect', (connection) => {
	console.log(connection);
	connection.on('message', (message) => {
		console.log(message.utf8Data);
	});

	connection.sendUTF(JSON.stringify({ message: new Date() }));
});
client.on('connectFailed', (err) => {
	console.log(err);
});
