var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.z = 100;

var controls = new THREE.TrackballControls(camera);
controls.dynamicDampingFactor = 0.5;
controls.rotateSpeed = 2;
controls.zoomSpeed = 1;
controls.panSpeed = 1;
controls.addEventListener("change", render);



var xhr = new XMLHttpRequest();
xhr.open('GET', './test.gcode', true);
xhr.onload = function () {
	var text = xhr.responseText;

	var ctx = new gcode.Context();
	ctx.rapidFeedRate = 800;
	var lines = text.split(/\n/);
	for (var i = 0, len = lines.length; i < len; i++) {
		ctx.executeBlock(gcode.Block.parse(lines[i]));
	}

	// done and render

	var geometry = new THREE.BufferGeometry();
//	var material = new THREE.LineBasicMaterial({
//		vertexColors: THREE.VertexColors,
//		linewidth: 2
//	});


	var material = new THREE.ShaderMaterial({
		uniforms:       {},
		attributes:     {},
		vertexShader:   document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		blending:       THREE.AdditiveBlending,
		depthTest:      false,
		transparent:    true,
		vertexColors: THREE.VertexColors,
		linewidth: 2
	});

	var positions = new Float32Array(ctx.motions.length * 6 + 1);
	var colors = new Float32Array(ctx.motions.length * 6 + 1);

	positions[0] = 0;
	positions[1] = 0;
	positions[2] = 0;
	colors[0] = 1;
	colors[1] = 1;
	colors[2] = 1;

	var duration = 0;
	for (var i = 1, len = ctx.motions.length; i < len; i++) {
		var motion = ctx.motions[i];
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

		duration += motion.duration;
	}

	console.log('duration', duration, 'sec', duration / 60, 'min');

	geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );

	geometry.computeBoundingBox();

	console.log(geometry.boundingBox);

	controls.target0.x = controls.position0.x = (Math.abs(geometry.boundingBox.max.x) - Math.abs(geometry.boundingBox.min.x)) / 2;
	controls.target0.y = controls.position0.y = (Math.abs(geometry.boundingBox.max.y) - Math.abs(geometry.boundingBox.min.y)) / 2;
	controls.position0.z =  (geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2 / Math.tan(Math.PI * camera.fov / 360);
	controls.reset();

	mesh = new THREE.Line( geometry, material );
	scene.add( mesh );

	var arrowX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 10, 0x990000, 3, 3);
	arrowX.line.material.linewidth = 5;
	scene.add(arrowX);
	var arrowY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 10, 0x009900, 3, 3);
	arrowY.line.material.linewidth = 5;
	scene.add(arrowY);
	var arrowZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 10, 0x000099, 3, 3);
	arrowZ.line.material.linewidth = 5;
	scene.add(arrowZ);

	var helper = new THREE.GridHelper( 200, 10 );
	helper.setColors( 0x999999, 0x666666 );
	helper.position.y = 0;
	helper.rotation.x = Math.PI / 2;
	scene.add( helper );

	render();

//	var x = 0;
//	setInterval(function () {
//		var i = x++;
//		var attr = geometry.getAttribute('color');
//		var colors = attr.array;
//		colors[i * 6 + 0] = colors[i * 6 + 3] = 0;
//		colors[i * 6 + 1] = colors[i * 6 + 4] = 0;
//		colors[i * 6 + 2] = colors[i * 6 + 5] = 0;
//		attr.needsUpdate = true;
//		render();
//	}, 1);
};
xhr.send();

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
document.body.ondblclick = function () {
	controls.reset();
};


var cameras = [
	{
		left: 0,
		bottom: 0,
		width: 0.5,
		height: 0.5,
		eye: [ 0, 100, 200 ],
		direction: [ 0, 1, 0 ]
	},
	{
		left: 0.5,
		bottom: 0,
		width: 0.5,
		height: 0.5,
		eye: [ 0, 0, 200 ],
		direction: [ -1, 0, 0 ]
	}
];

for (var i = 0, it; (it = cameras[i]); i++) {
	it.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0, 1000 );
}

function render () {
//	var left   = 0;
//	var bottom = window.innerHeight / 2;
//	var width  = window.innerWidth;
//	var height = window.innerHeight / 2;
//
//	// main camera
//	// renderer.setSize();
//	renderer.setViewport(left, bottom, width, height);
//	renderer.setScissor(left, bottom, width, height);
//	renderer.enableScissorTest(true);
//	camera.aspect = width / height;
//	camera.updateProjectionMatrix();
//	renderer.render(scene, camera);
//
//	for (var i = 0, it; (it = cameras[i]); i++) {
//		
//	}
	renderer.render(scene, camera);
}

requestAnimationFrame(function render () {
	controls.update();
	requestAnimationFrame(render);
});
