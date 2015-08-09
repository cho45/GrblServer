
Polymer({
	is: "my-app",

	properties: {
		status: {
			type: Object,
			value: {
				state: 'Unknown'
			}
		},

		isConnected: {
			type: Boolean,
			value: false
		},

		commandTab: {
			type: Number,
			value: 1
		},

		positioningSystem: {
			type: Number,
			value: 0
		},

		jogStep : {
			type: Number,
			value: 1
		},

		jogStepList : {
			type: Array,
			value: [
				0.1,
				0.5,
				1,
				10
			]
		},

		jogFeedRate : {
			type: Number,
			value: 500
		},

		jogFeedRateList : {
			type: Array,
			value: [
				100,
				200,
				500,
				800,
				1000
			]
		},

		commandHistory: {
			type: Array,
			value: []
		},

		error: {
			type: String,
			value: ''
		},

		gcode: {
			type: Object,
			value: null
		},

		config: {
			type: Array,
			value: [
				{
					name: '$1',
					desc: 'step pulse, usec',
					value: 10
				}
			]
		}
	},

	_id : 0,
	_callbacks : {},

	ready : function () {
		var self = this;
		console.log('ready');

		self.async(function () {
			var uploadFile = document.getElementById('upload-file');
			var inputFile = uploadFile.querySelector('input[type=file]');

			uploadFile.onclick = function () {
				inputFile.click();
			};

			inputFile.onchange = function () {
				var files = inputFile.files;
				self.uploadFile(files[0]);
			};

			document.body.addEventListener("drop", function (e) {
				e.preventDefault();
				var files = e.dataTransfer.files;
				self.uploadFile(files[0]);
			}, false);
			document.body.addEventListener("dragenter", function (e) {
				e.preventDefault();
			}, false);
			document.body.addEventListener("dragover", function (e) {
				e.preventDefault();
			}, false);
		});

		this.openWebSocket();

		this.loadConfig();
		var dialog = document.getElementById('config-dialog');
		document.body.appendChild(dialog);
		dialog.open();
	},

	loadConfig : function () {
		var lines = [ '$0=10 (step pulse, usec)',
'$1=25 (step idle delay, msec)',
'$2=0 (step port invert mask:00000000)',
'$3=6 (dir port invert mask:00000110)',
'$4=0 (step enable invert, bool)',
'$5=0 (limit pins invert, bool)',
'$6=0 (probe pin invert, bool)',
'$10=3 (status report mask:00000011)',
'$11=0.020 (junction deviation, mm)',
'$12=0.002 (arc tolerance, mm)',
'$13=0 (report inches, bool)',
'$20=0 (soft limits, bool)',
'$21=0 (hard limits, bool)',
'$22=0 (homing cycle, bool)',
'$23=1 (homing dir invert mask:00000001)',
'$24=50.000 (homing feed, mm/min)',
'$25=635.000 (homing seek, mm/min)',
'$26=250 (homing debounce, msec)',
'$27=1.000 (homing pull-off, mm)',
'$100=314.961 (x, step/mm)',
'$101=314.961 (y, step/mm)',
'$102=314.961 (z, step/mm)',
'$110=635.000 (x max rate, mm/min)',
'$111=635.000 (y max rate, mm/min)',
'$112=635.000 (z max rate, mm/min)',
'$120=50.000 (x accel, mm/sec^2)',
'$121=50.000 (y accel, mm/sec^2)',
'$122=50.000 (z accel, mm/sec^2)',
'$130=225.000 (x max travel, mm)',
'$131=125.000 (y max travel, mm)',
'$132=170.000 (z max travel, mm)'];

		for (var i = 0, len = lines.length; i < len; i++) {
			var m = lines[i].match(/^(\$\d+)=([^ ]+) \((.+?)\)/);
			this.push('config', {
				name : m[1],
				desc : m[3],
				value: m[2]
			});
		}
	},

	openWebSocket : function () {
		var self = this;
		self.connection = new WebSocket('ws://localhost:8080');
		self.connection.onopen = function (e) {
			self.isConnected = true;
		};
		self.connection.onerror = function (e) {
			self.set('status.state', 'Unknown');
			self.set('error', e);
			console.log(e);

			setTimeout(function () {
				self.openWebSocket();
			}, 3000);
		};
		self.connection.onclose = function (e) {
			self.set('status.state', 'Unknown');
			self.set('error', 'Disconnected');
			console.log(e);

			setTimeout(function () {
				self.openWebSocket();
			}, 3000);
		};
		self.connection.onmessage = function (e) {
			var res = JSON.parse(e.data);
			console.log(res);
			if (res.id !== null) {
				var callback = self._callbacks[res.id];
				if (!callback) {
					console.log('unknwon callback id:', res.id, self._callbacks);
				}
				if (res.hasOwnProperty('error')) {
					callback.reject(res.error);
				} else {
					callback.resolve(res.result);
				}
			} else {
				if (res.error) {
					self.set('error', [res.error.code, res.error.message, JSON.stringify(res.error.data)].join(' : '));
				} else {
					self.processNotification(res.result);
				}
			}
		};
		self.connection.onclose = function  (e) {
			self.isConnected = false;
		};
	},

	initialize : function () {
		var self = this;
		self.set('error', self.properties.error.value);
		self.set('status', self.properties.status.value);
	},

	processNotification : function (res) {
		console.log('processNotification', res);
		var self = this;
		if (res.type === 'init') {
			console.log('init');
			self.set('error', res.lastFeedback || res.lastAlarm);
			self.set('status.state', res.status.state || 'Unknown');
			self.set('status.workingPosition', res.status.workingPosition);
			self.set('status.machinePosition', res.status.machinePosition);
		} else
		if (res.type === 'startup') {
			self.initialize();
			self.commandHistory.push('<< Grbl ' + res.version.major + res.version.minor);
		} else
		if (res.type === 'status') {
			self.set('status.state', res.status.state || 'Unknown');
			self.set('status.workingPosition', res.status.workingPosition);
			self.set('status.machinePosition', res.status.machinePosition);
		} else
		if (res.type === 'alarm') {
			self.set('error', res.message);
			self.commandHistory.push('<< ALARM:' + res.message);
			alert(res.message);
		} else
		if (res.type === 'feedback') {
			self.set('error', res.message);
			self.commandHistory.push('<< [' + res.message + ']');
		} else
		if (res.type === 'gcode') {
			self.set('gcode', res.gcode);
			for (var key in self.gcode) if (self.gcode.hasOwnProperty(key)) {
				self.notifyPath('gcode.' + key, self.gcode[key]);
			}
		} else
		if (res.type === 'gcode.start') {
			self.set('gcode.startedTime', res.time);
		} else
		if (res.type === 'gcode.progress') {
			self.push('gcode.sent', self.shift('gcode.remain'));
			self.async(function () {
				var container = document.getElementById('gcode-list');
				var target = container.querySelector('.remain');
				container.scrollTop = target.offsetTop - 100;
			});
		} else
		if (res.type === 'gcode.done') {
			alert('Done');
		}

		self.cleanupCommandHistory();

		if (self.error == "'$H'|'$X' to unlock") {
			self.set('error', '');
		}
	},

	request : function (method, params) {
		var self = this;

		console.log(method, params);

		return new Promise(function (resolve, reject) {
			var id = self._id++;
			self._callbacks[id] = {
				resolve: resolve,
				reject: reject
			};
			self.connection.send(JSON.stringify({
				id: id,
				method: method,
				params: params
			}));
		});
	},

	command : function (command) {
		var self = this;
		self.commandHistory.push('>> ' + command);
		self.cleanupCommandHistory();
		self.request('command', { command: command }).
			then(function (r) {
				if (r) {
					for (var i = 0, it; (it = r[i]); i++) {
						self.commandHistory.push('<< ' + it.message);
					}
				}
				self.commandHistory.push('<< ok');
				self.cleanupCommandHistory();
			}, function (e) {
				self.commandHistory.push('<< error:' + e.message);
				self.cleanupCommandHistory();
			});
	},

	cleanupCommandHistory : function () {
		var self = this;
		while (self.commandHistory.length > 50) self.commandHistory.shift();
		self.set('commandHistory', self.commandHistory.slice(0));
		self.async(function () {
			var history = document.getElementById('command-history');
			history.scrollTop = history.scrollHeight;
		});
	},

	resetToZero : function (e) {
		var target = Polymer.dom(e).path.filter(function (i) {
			return i.getAttribute && i.getAttribute('data-axis');
		})[0];
		var axis = target.getAttribute('data-axis');

		var command = axis.toUpperCase().split(/\s+/).map(function (a) {
			return a + '0';
		});

		this.command('G10 P0 L20 ' + command);
	},


	commandReturn : function () {
		this.command('G90 G0 Z0');
		this.command('G90 G0 X0 Y0');
	},

	commandMove : function (e) {
		var target = Polymer.dom(e).path.filter(function (i) {
			return i.getAttribute && i.getAttribute('data-axis');
		})[0];
		var axis = target.getAttribute('data-axis');
		var direction = +target.getAttribute('data-direction');
		console.log(axis, direction);

		var step = this.jogStep * direction;
		this.command('G21 G91 G0 ' + axis.toUpperCase() + step);
	},

	commandResume : function (e) {
		this.request('resume', {});
	},

	commandPause : function (e) {
		this.request('pause', {});
	},

	commandReset : function (e) {
		this.request('reset', {});
	},

	commandHoming : function (e) {
		this.command('$H');
	},

	commandUnlock : function (e) {
		this.command('$X');
	},

	commandRunGCode : function (e) {
		this.request('gcode', { execute: true });
	},

	commandClearUploadedFile : function (e) {
		this.request('gcode', { clear: true });
	},

	commandAny : function (e) {
		if (e.keyIdentifier !== 'Enter') return;
		var value = e.target.value;
		e.target.value = "";
		this.command(value);
	},

	formatCoords : function (axis) {
		var system = {
			0: 'workingPosition',
			1: 'machinePosition'
		}[this.positioningSystem];

		console.log(this.status);

		var number;
		try {
			number = this.status[system][axis];
		} catch (e) {
			number = 0;
		}
		return sprintf('%s%03.3f', number < 0 ? '' : '+', number);
	},

	uploadFile : function (file) {
		var self = this;

		console.log('uploadFile');
		console.log(file.name, file.size);

		var reader = new FileReader();
		reader.onload = function (e) {
			self.request("upload", {
				name: file.name,
				size: file.size,
				gcode: reader.result 
			}).
				then(function () {
					alert('uploaded');
				}, function (e) {
					alert(e);
				});
		};
		reader.onerror = function (e) {
			console.log(e);
			alert(e);
		};
		reader.onabort = function (e) {
			console.log(e);
			alert(e);
		};
		reader.onloadstart = function (e) {
			console.log('onloadstart');
		};
		reader.onprogress = function (e) {
			console.log('onprogress');
		};
		reader.onloadend = function (e) {
			console.log('onloadend');
		};
		reader.readAsText(file, 'UTF-8');
	},

	changeFeedRate : function (e) {
		var value = Polymer.dom(e).path.filter(function (i) {
			console.log(i);
			return i.getAttribute && i.getAttribute('data-value');
		})[0].getAttribute('data-value');

		this.set('jogFeedRate', value);
	},

	changeStep : function (e) {
		var value = Polymer.dom(e).path.filter(function (i) {
			console.log(i);
			return i.getAttribute && i.getAttribute('data-value');
		})[0].getAttribute('data-value');

		this.set('jogStep', value);
	},

	bind: function (id) { return id },
	equals: function (a, b) { return a == b },
	conditional: function (bool, a, b) { return bool ? a : b; },
	sprintf: sprintf,
	strftime: function (format, epoch) {
		if (!epoch) return "";
		var date = new Date(epoch);
		return strftime(format, date);
	}
});
