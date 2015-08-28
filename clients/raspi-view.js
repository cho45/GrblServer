#!node


var blessed = require('blessed');
var WebSocket = require('websocket').w3cwebsocket; // no warnings
var _ = require('underscore');


// Note:: 320x240px TFT -> 40x15

var screen = blessed.screen({ // no warnings
	autoPadding: true,
	smartCSR: true
});
screen.title = 'grbl server console';

var serverStatusContainer = blessed.box({
	parent: screen,
	top: 0,
	left: 0,
	width: '100%',
	height: '50%',
	tags: true,
	style: {
	}
});

var time = blessed.box({
	parent: serverStatusContainer,
	width: 10,
	content: '[00:00:00]',
	style: {
	}
});

setInterval(function () {
	var now = new Date();
	var formatted  = 
			String(100 + now.getHours()).slice(1) +
			':' +
			String(100 + now.getMinutes()).slice(1) +
			':' +
			String(100 + now.getSeconds()).slice(1);
	time.setContent( '[' + formatted + ']');

	screen.render();
}, 1000);

var serverStatus = blessed.box({
	parent: serverStatusContainer,
	width: 12,
	top: 0,
	left: 11,
	content: 'Disconnected',
	style: {
	}
});

var grblStatus = blessed.box({
	parent: screen,
	width: 15,
	top: 0,
	left: 24,
	content: 'Status: Unknown',
	style: {
	}
});

var grblStatusError = blessed.box({
	parent: screen,
	width: '100%',
	height: 2,
	top: 1,
	left: 0,
	content: ''
});

var grblCoordsContainer = blessed.box({
	parent: screen,
	top: 4,
	left: 5,
	width: 30,
	height: 6,
	style: {
		fg: 'black',
		bg: 'white'
	}
});

do {
	var grblCoordsWorkingContainer = blessed.box({
		parent: grblCoordsContainer,
		width: 15,
		height: 5,
		top: 0,
		left: 0
	});

	var grblCoordsWorkingLabel = blessed.box({
		parent: grblCoordsWorkingContainer,
		width: 15,
		height: 5,
		top: 0,
		left: 0,
		content: 'Working:'
	});

	var grblCoordsWorking = blessed.box({
		parent: grblCoordsWorkingContainer,
		width: 15,
		height: 5,
		top: 1,
		left: 0,
		border: {
			type: 'line'
		}
	});

	var grblCoordsWorkingXLabel = blessed.box({
		parent: grblCoordsWorking,
		width: 3,
		height: 1,
		top: 0,
		left: 0,
		content: 'X:'
	});

	var grblCoordsWorkingXValue = blessed.box({
		parent: grblCoordsWorking,
		width: '100%-5',
		height: 1,
		top: 0,
		left: 3,
		align: 'right',
		content: '100.000'
	});
	var grblCoordsWorkingYLabel = blessed.box({
		parent: grblCoordsWorking,
		width: 3,
		height: 1,
		top: 1,
		left: 0,
		content: 'Y:'
	});

	var grblCoordsWorkingYValue = blessed.box({
		parent: grblCoordsWorking,
		width: '100%-5',
		height: 1,
		top: 1,
		left: 3,
		align: 'right',
		content: '100.000'
	});
	var grblCoordsWorkingZLabel = blessed.box({
		parent: grblCoordsWorking,
		width: 3,
		height: 1,
		top: 2,
		left: 0,
		content: 'Z:'
	});

	var grblCoordsWorkingZValue = blessed.box({
		parent: grblCoordsWorking,
		width: '100%-5',
		height: 1,
		top: 2,
		left: 3,
		align: 'right',
		content: '100.000'
	});
} while (0);

do {
	var grblCoordsMachineContainer = blessed.box({
		parent: grblCoordsContainer,
		width: 15,
		height: 5,
		top: 0,
		left: 15
	});

	var grblCoordsMachineLabel = blessed.box({
		parent: grblCoordsMachineContainer,
		width: 15,
		height: 5,
		top: 0,
		left: 0,
		content: 'Machine:'
	});

	var grblCoordsMachine = blessed.box({
		parent: grblCoordsMachineContainer,
		width: 15,
		height: 5,
		top: 1,
		left: 0,
		border: {
			type: 'line'
		}
	});

	var grblCoordsMachineXLabel = blessed.box({
		parent: grblCoordsMachine,
		width: 3,
		height: 1,
		top: 0,
		left: 0,
		content: 'X:'
	});

	var grblCoordsMachineXValue = blessed.box({
		parent: grblCoordsMachine,
		width: '100%-5',
		height: 1,
		top: 0,
		left: 3,
		align: 'right',
		content: '100.000'
	});
	var grblCoordsMachineYLabel = blessed.box({
		parent: grblCoordsMachine,
		width: 3,
		height: 1,
		top: 1,
		left: 0,
		content: 'Y:'
	});

	var grblCoordsMachineYValue = blessed.box({
		parent: grblCoordsMachine,
		width: '100%-5',
		height: 1,
		top: 1,
		left: 3,
		align: 'right',
		content: '100.000'
	});
	var grblCoordsMachineZLabel = blessed.box({
		parent: grblCoordsMachine,
		width: 3,
		height: 1,
		top: 2,
		left: 0,
		content: 'Z:'
	});

	var grblCoordsMachineZValue = blessed.box({
		parent: grblCoordsMachine,
		width: '100%-5',
		height: 1,
		top: 2,
		left: 3,
		align: 'right',
		content: '100.000'
	});
} while (0);

//var grblGCodeContainer = blessed.box({
//	parent: screen,
//	top: 8,
//	left: 0,
//	width: '100%',
//	height: 10
//});
//
//var grblGCodeLabel = blessed.box({
//	parent: grblGCodeContainer,
//	top: 0,
//	left: 0,
//	width: '100%',
//	height: 1,
//	content: 'Exec:'
//});
//
//var grblGCodeLabelName = blessed.box({
//	parent: grblGCodeLabel,
//	top: 0,
//	left: 6,
//	width: '100%-6',
//	height: 1,
//	content: ''
//});
//
//var grblGCodeBody = blessed.list({
//	parent: grblGCodeContainer,
//	top: 1,
//	left: 0,
//	width: '100%',
//	height: '100%-1',
//	style: {
//		item: {
//			fg: 'white',
//			bg: 'black'
//		},
//		selected: {
//			fg: 'black',
//			bg: 'white'
//		}
//	}
//});
//
screen.key(['C-c'], function (ch, key) {
  return process.exit(0);
});

screen.render();

(function openWebSocket() {
	var client = new WebSocket('ws://localhost:8080/');
	serverStatus.setContent('Connecting...');
	render();
	client.onopen = function () {
		serverStatus.setContent('Connected');
		render();
	};
	client.onerror = function () {
		serverStatus.setContent('Error');
		render();
	};
	client.onclose = function () {
		client = null;
		serverStatus.setContent('Disconnected');
		render();
		setTimeout(openWebSocket, 1000);
	};
	client.onmessage = function (e) {
		var res = JSON.parse(e.data);
		if (res.id === null) {
			if (res.error) {
				console.log(res);
				grblStatusError.setContent('Error:' + [res.error.code, res.error.message, res.error.data].join(' : '));
				return;
			}

			res = res.result;

			if (res.type === 'init') {
				grblStatusError.setContent(res.lastFeedback || res.lastAlarm);
				grblStatus.setContent('Status: ' + res.status.state);
				updatePosition(res.status.workingPosition, res.status.machinePosition);
				render();
			} else
			if (res.type === 'startup') {
			} else
			if (res.type === 'status') {
				grblStatus.setContent(res.status.state || 'Unknown');
				updatePosition(res.status.workingPosition, res.status.machinePosition);
			} else
			if (res.type === 'alarm') {
				grblStatusError.setContent(res.message);
			} else
			if (res.type === 'feedback') {
				grblStatusError.setContent(res.message);
			} else
			if (res.type === 'gcode') {
//				grblGCodeBody.setItems(res.gcode.sent.concat(res.gcode.remain));
//				grblGCodeBody.select(res.gcode.sent.length);
//				grblGCodeLabelName.setContent(res.gcode.name);
			} else
			if (res.type === 'gcode.start') {
				// self.set('gcode.startedTime', res.time);
			} else
			if (res.type === 'gcode.progress') {
//				grblGCodeBody.down();
			} else
			if (res.type === 'gcode.done') {
//				grblGCodeBody.down();
			}
			render();
		}
	};

	function render() {
		_.throttle(function () {
			screen.render();
		}, 1000);
	}

	function updatePosition(working, machine) {
		grblCoordsWorkingXValue.setContent(working.x.toFixed(3));
		grblCoordsWorkingYValue.setContent(working.y.toFixed(3));
		grblCoordsWorkingZValue.setContent(working.z.toFixed(3));
		grblCoordsMachineXValue.setContent(machine.x.toFixed(3));
		grblCoordsMachineYValue.setContent(machine.y.toFixed(3));
		grblCoordsMachineZValue.setContent(machine.z.toFixed(3));
	}
})();
