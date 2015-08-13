//#!tsc --target ES5 --module commonjs sketch.ts && node sketch.js

///<reference path="./typings/bundle.d.ts"/>
///<reference path="./typings/serialport.d.ts" />

import {Grbl} from './grbl';
import serialport = require("serialport");

var sp = new serialport.SerialPort('/dev/tty.usbserial-DJ00345C', {
	baudrate: 2400,
}, false);

sp.on('error', (e) => {
	console.log(e);
});

sp.on('data', function (a) {
	console.log(a);
});

console.log(sp);

setInterval(() => {
	console.log(sp);
}, 10000);


//var sp = new serialport.SerialPort('/dev/tty.usbserial-AL011AVX', {
//	baudrate: 115200,
//	parser: serialport.parsers.readline("\n")
//}, false);
//
//var grbl = new Grbl(sp);
//grbl.open().
//	then(() => {
//		return grbl.command("$X");
//	}).
//	then(() => {
//		command();
//	});
//grbl.on('raw', (line) => {
//	console.log(line);
//});
//grbl.on('error', (e) => {
//	console.log('Error on grbl: ' + e);
//});
//
//	var i = 0;
//	function command () {
//		console.log('command');
//		return grbl.command(
//				(i % 2 == 0) ? 'G01 X0.000 Y0.000 F' + (500 + i++): 
//				               'G01 X5.000 Y5.000 F' + (500 + i++)
//				).
//			then( () => {
//				return command();
//			}, (e) => {
//			});
//	}
//
//
//setTimeout(function () {
//	grbl.command("$#");
//}, 5000);
