//#!tsc --target ES5 --module commonjs sketch.ts && node sketch.js
///<reference path="./typings/bundle.d.ts"/>
///<reference path="./typings/serialport.d.ts" />
var grbl_1 = require('./grbl');
var serialport = require("serialport");
var sp = new serialport.SerialPort('/dev/tty.usbserial-AL011AVX', {
    baudrate: 115200,
    parser: serialport.parsers.readline("\n")
}, false);
var grbl = new grbl_1.Grbl(sp);
grbl.open().
    then(function () {
    return grbl.command("$X");
}).
    then(function () {
    command();
});
grbl.on('raw', function (line) {
    console.log(line);
});
grbl.on('error', function (e) {
    console.log('Error on grbl: ' + e);
});
var i = 0;
function command() {
    console.log('command');
    return grbl.command((i % 2 == 0) ? 'G01 X0.000 Y0.000 F' + (500 + i++) :
        'G01 X5.000 Y5.000 F' + (500 + i++)).
        then(function () {
        return command();
    }, function (e) {
    });
}
setTimeout(function () {
    grbl.command("$#");
}, 5000);
