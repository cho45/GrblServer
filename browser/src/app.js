
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
			value: 0
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

		commandHistoryIndex: {
			type: Number,
			value: 0
		},

		error: {
			type: String,
			value: ''
		},

		gcode: {
			type: Object,
			value: null
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
				inputFile.value = "";
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

			Array.prototype.forEach.call(document.querySelectorAll(".jog paper-button"), function (button) {
				var axis = button.getAttribute('data-axis');
				var direction = +button.getAttribute('data-direction');

				var touch = false;

				var move = function () {
					var step = self.jogStep * direction;
					return Promise.all([
						// move
						self.request('command', { command: 'G21 G91 G0 ' + axis.toUpperCase() + step }),
						// sync
						self.request('command', { command: 'G4 P0.01' })
					]).then(function () {
						if (touch) {
							return move();
						}
					});
				};

				var touchstart = function (e) {
					console.log('start');
					e.preventDefault();
					console.log(axis, direction);
					touch = true;
					move();
				};

				var touchend = function (e) {
					console.log('end');
					e.preventDefault();
					touch = false;
				};

				if (typeof ontouchstart !== "undefined") {
					button.addEventListener("touchstart", touchstart);
					button.addEventListener("touchend", touchend);
				} else {
					button.addEventListener("mousedown", touchstart);
					button.addEventListener("mouseup", touchend);
				}
			});
		});

		this.openWebSocket();
	},

	openWebSocket : function () {
		var self = this;
		self.connection = new WebSocket('ws://' + (localStorage["grblServer"] || location.host));
		self.connection.onopen = function (e) {
			self.isConnected = true;
		};
		self.connection.onerror = function (e) {
			console.log('onerror', e);
			self.set('status.state', 'Unknown');
			self.set('error', e);
		};
		self.connection.onclose = function  (e) {
			console.log('onclose', e);
			self.set('status.state', 'Unknown');
			self.set('error', 'Disconnected');
			self.isConnected = false;

			setTimeout(function () {
				self.openWebSocket();
			}, 1000);
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
	},

	initialize : function () {
		var self = this;
		self.set('error', self.properties.error.value);
		self.set('status', self.properties.status.value);
	},

	processNotification : function (res) {
		console.log('processNotification', res);
		var self = this;
		console.log(res);
		if (res.type === 'init') {
			console.log('init');
			self.set('error', res.lastFeedback || res.lastAlarm);
			self.set('status.state', res.status.state || 'Unknown');
			self.set('status.workingPosition', res.status.workingPosition);
			self.set('status.machinePosition', res.status.machinePosition);
		} else
		if (res.type === 'startup') {
			self.initialize();
			self.addCommandHistory('<<', res.raw);
		} else
		if (res.type === 'status') {
			self.set('status.state', res.status.state || 'Unknown');
			self.set('status.workingPosition', res.status.workingPosition);
			self.set('status.machinePosition', res.status.machinePosition);
		} else
		if (res.type === 'alarm') {
			self.set('error', res.message);
			self.addCommandHistory('<<', res.raw);
			alert(res.message);
		} else
		if (res.type === 'feedback') {
			self.set('error', res.message);
			self.addCommandHistory('<<', res.raw);
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
		self.addCommandHistory('>>', command);
		return self.request('command', { command: command }).
			then(function (r) {
				if (r) {
					for (var i = 0, it; (it = r[i]); i++) {
						self.addCommandHistory('<<', it.raw);
					}
				}
				self.addCommandHistory('<<', 'ok');
			}, function (e) {
				self.addCommandHistory('<<', 'error:' + e.message);
			});
	},

	addCommandHistory : function (prefix, value) {
		var self = this;
		self.push('commandHistory', {
			prefix: prefix,
			value: value
		});
		while (self.commandHistory.length > 100) self.shift('commandHistory');
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
		var self = this;
		if (e.keyIdentifier === 'Enter') {
			var value = e.target.value;
			e.target.value = "";
			self.commandHistoryIndex = 0;
			self.command(value);
		} else
		if (e.keyIdentifier === 'Up') {
			var history = self.commandHistory.filter(function (x) { return x.prefix === '>>' }).reverse();
			self.commandHistoryIndex++;
			if (self.commandHistoryIndex > history.length) {
				self.commandHistoryIndex = history.length;
			}
			try {
				e.target.value = history[self.commandHistoryIndex-1].value;
			} catch (e) { }
		} else
		if (e.keyIdentifier === 'Down') {
			var history = self.commandHistory.filter(function (x) { return x.prefix === '>>' }).reverse(); // no warnings
			if (self.commandHistoryIndex > 0) self.commandHistoryIndex--;
			try {
				e.target.value = history[self.commandHistoryIndex-1].value;
			} catch (e) { }
		}
	},

	formatCoords : function (axis) {
		var system = {
			0: 'workingPosition',
			1: 'machinePosition'
		}[this.positioningSystem];

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

	progressStyle : function () {
		try {
			return "width: " + (this.gcode.sent / (this.gcode.sent + this.gcode.remain) * 100) + "%";
		} catch (e) {
			return "visibility: hidden";
		}
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
