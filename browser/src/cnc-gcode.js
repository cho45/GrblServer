Polymer({
	is: "cnc-gcode",
	properties: {
		view: {
			type: String,
			value: 'top'
		},

		rapidFeedRate: {
			type: Number,
			value: 0
		}
	},

	created : function () {
		var self = this;
		self.scene = new THREE.Scene();
		self.camera = new THREE.PerspectiveCamera( 75, 3/2, 0.1, 1000 );
		self.camera.position.z = 100;


		self.renderer = new THREE.WebGLRenderer({ antialias: true });
		self.renderer.setPixelRatio( window.devicePixelRatio );

		var arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 10, 0x990000, 3, 3);
		arrowX.line.material.linewidth = 5;
		self.scene.add(arrowX);
		var arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 10, 0x009900, 3, 3);
		arrowY.line.material.linewidth = 5;
		self.scene.add(arrowY);
		var arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 10, 0x000099, 3, 3);
		arrowZ.line.material.linewidth = 5;
		self.scene.add(arrowZ);

		var helper = new THREE.GridHelper( 200, 10 );
		helper.setColors( 0x999999, 0x444444 );
		helper.position.y = 0;
		helper.rotation.x = Math.PI / 2;
		self.scene.add( helper );
	},

	ready : function () {
	},

	attached : function () {
		var self = this;
		var container = document.getElementById('container');

		container.appendChild( self.renderer.domElement );

		self.controls = new THREE.TrackballControls(self.camera, container);
		self.controls.dynamicDampingFactor = 0.5;
		self.controls.rotateSpeed = 2;
		self.controls.zoomSpeed = 1;
		self.controls.panSpeed = 1;
		self.controls.addEventListener("change", function () {
			self.render();
		});


		self.refit();
		self.resetCamera();
		self.render();

		self.dispatchEvent(new CustomEvent("cnc-gcode-initialized", {
			detail: null
		}));

		requestAnimationFrame(function render () {
			self.controls.update();
			requestAnimationFrame(render);
		});
	},

	refit : function () {
		var self = this;
		if (!self.camera) return;

		var container = document.getElementById('container');
		if (!container) return;
		console.log('creating three.js view for', container, container.offsetWidth, container.offsetHeight);

		var width = container.offsetWidth;
		var height = container.offsetHeight;

		self.camera.aspect = width / height;
		self.camera.updateProjectionMatrix();

		self.renderer.setSize(width, height);
		self.renderer.setPixelRatio( window.devicePixelRatio );
		self.render();
	},

	render : function () {
		var self = this;
		self.renderer.render(self.scene, self.camera);
	},


	/**
	 * Initialize G-code context
	 */
	initContext : function () {
		var self = this;
		self.context = new gcode.Context();
		self.lineNumber = 1;
		self.lineNumberMotionMap = {};
	},

	/**
	 * Execute a G-code block
	 *
	 * @return {number} duration
	 */
	executeBlock : function (line) {
		var self = this;
		var motions = self.context.executeBlock(gcode.Block.parse(line));
		self.lineNumberMotionMap[ self.lineNumber++ ] = motions;
		var ret = 0;
		for (var i = 0, it; (it = motions[i]); i++) {
			ret += it.duration;
		}
		return ret;
	},

	/**
	 * A utility method for just showing paths
	 *
	 * 1. initContext()
	 * 2. split argument to lines and execute
	 * 3. constructPathObject()
	 * 4. render()
	 */
	loadGCode : function (raw) {
		var self = this;
		self.initContext();
		self.context.rapidFeedRate = self.rapidFeedRate;

		var lines = raw.split(/\n/);
		for (var i = 0, len = lines.length; i < len; i++) {
			self.context.executeBlock(gcode.Block.parse(lines[i]));
		}

		self.constructPathObject();
		self.render();
	},

	/**
	 * Construct 3D path object for this context
	 */
	constructPathObject : function () {
		var self = this;
		if (self.path) {
			self.scene.remove(self.path);
			self.path.geometry.dispose();
		}

		var geometry = new THREE.BufferGeometry();
		var material = new THREE.ShaderMaterial({
			uniforms:       {},
			attributes:     {},
			vertexShader:   document.getElementById('vertexshader').textContent,
			fragmentShader: document.getElementById('fragmentshader').textContent,
			blending:       THREE.AdditiveBlending,
			depthTest:      false,
			transparent:    true,
			vertexColors: THREE.VertexColors,
			linewidth: 2
		});

		var positions = new Float32Array(self.context.motions.length * 6 + 1);
		var colors = new Float32Array(self.context.motions.length * 6 + 1);

		positions[0] = 0;
		positions[1] = 0;
		positions[2] = 0;
		colors[0] = 1;
		colors[1] = 1;
		colors[2] = 1;

		for (var i = 1, len = self.context.motions.length; i < len; i++) {
			var motion = self.context.motions[i];
			motion._pathIndex = i;
			positions[i * 6 + 0] = motion.prevMotion.x;
			positions[i * 6 + 1] = motion.prevMotion.y;
			positions[i * 6 + 2] = motion.prevMotion.z;
			positions[i * 6 + 3] = motion.x;
			positions[i * 6 + 4] = motion.y;
			positions[i * 6 + 5] = motion.z;

			if (motion.type === 'G0') {
				colors[i * 6 + 0] = colors[i * 6 + 3] = 1;
				colors[i * 6 + 1] = colors[i * 6 + 4] = 0;
				colors[i * 6 + 2] = colors[i * 6 + 5] = 0;
			} else
			if (motion.type === 'G2' || motion.type === 'G3') {
				colors[i * 6 + 0] = colors[i * 6 + 3] = 1;
				colors[i * 6 + 1] = colors[i * 6 + 4] = 0;
				colors[i * 6 + 2] = colors[i * 6 + 5] = 1;
			} else {
				colors[i * 6 + 0] = colors[i * 6 + 3] = 1;
				colors[i * 6 + 1] = colors[i * 6 + 4] = 1;
				colors[i * 6 + 2] = colors[i * 6 + 5] = 1;
			}
		}

		geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
		geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

		geometry.computeBoundingBox();

		self.path = new THREE.Line( geometry, material );
		self.scene.add(self.path);

		self.resetCamera();
	},

	/**
	 * Override path color for current path object created from current context.
	 *
	 * This method is only valid after calling constructPathObject()
	 */
	overridePathColor : function (lineNumber, color) {
		var self = this;
		color = new THREE.Color(color);
		var attr = self.path.geometry.getAttribute('color');
		var colors = attr.array;
		var motions = self.lineNumberMotionMap[lineNumber];
		for (var j = 0, it; (it = motions[j]); j++) {
			var i = it._pathIndex;
			colors[i * 6 + 0] = colors[i * 6 + 3] = color.r;
			colors[i * 6 + 1] = colors[i * 6 + 4] = color.g;
			colors[i * 6 + 2] = colors[i * 6 + 5] = color.b;
		}
		attr.needsUpdate = true;
	},

	resetCamera : function () {
		var self = this;
		if (!self.controls) return;
		var box = self.path ? self.path.geometry.boundingBox : {
			max : new THREE.Vector3( 10,  10,  10),
			min : new THREE.Vector3(-10, -10, -10)
		};
		self.controls.target0.x = self.controls.position0.x = (Math.abs(box.max.x) - Math.abs(box.min.x)) / 2;
		self.controls.target0.y = self.controls.position0.y = (Math.abs(box.max.y) - Math.abs(box.min.y)) / 2;
		self.controls.target0.z = self.controls.position0.z = (Math.abs(box.max.z) - Math.abs(box.min.z)) / 2;
		({
			'top' : function () {
				self.controls.position0.z =  Math.max(box.max.y - box.min.y, box.max.x - box.min.x) / 2 / Math.tan(Math.PI * self.camera.fov / 360);
				self.controls.up0.set(0, 1, 0);
				self.controls.reset();
			},
			'left' : function () {
				self.controls.position0.x =  -Math.max(box.max.z - box.min.z, box.max.y - box.min.y) / 2 / Math.tan(Math.PI * self.camera.fov / 360);
				self.controls.up0.set(0, 0, 1);
				self.controls.reset();
			},
			'front' : function () {
				self.controls.position0.y =  -Math.max(box.max.z - box.min.z, box.max.x - box.min.x) / 2 / Math.tan(Math.PI * self.camera.fov / 360);
				self.controls.up0.set(0, 0, 1);
				self.controls.reset();
			},
			'down' : function () {
				self.controls.position0.x =  Math.max(box.max.z - box.min.z, box.max.y - box.min.y) / 2 / Math.tan(Math.PI * self.camera.fov / 360);
				self.controls.position0.y =  -Math.max(box.max.z - box.min.z, box.max.x - box.min.x) / 2 / Math.tan(Math.PI * self.camera.fov / 360);
				self.controls.position0.z =  Math.max(box.max.y - box.min.y, box.max.x - box.min.x) / 2 / Math.tan(Math.PI * self.camera.fov / 360);
				self.controls.up0.set(0, 0, 1);
				self.controls.reset();
			}
		})[this.view]();
	},

	changeView : function () {
		var views = ['top', 'left', 'front', 'down'];
		this.view = views[ (views.indexOf(this.view) + 1) % views.length ];
		this.resetCamera();
	}
});

