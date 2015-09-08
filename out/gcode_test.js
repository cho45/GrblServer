//#!tsc --target ES5 --module commonjs gcode_test.ts && node gcode_test.js
var gcode_1 = require("./gcode");
var assert = require('assert');
(function () {
    var ctx = new gcode_1.gcode.Context();
    ctx.executeBlock(gcode_1.gcode.Block.parse('G2 X1 Y1 I1 F10'));
    for (var i = 0, it; (it = ctx.lines[i]); i++) {
        console.log(it);
        assert(0 <= it.x2 && it.x2 <= 1);
        assert(0 <= it.y2 && it.y2 <= 1);
        assert(it.x2 <= it.y2);
        assert(it.z2 === 0);
    }
    var last = ctx.lines[ctx.lines.length - 1];
    assert.equal(last.x2, 1);
    assert.equal(last.y2, 1);
    assert.equal(last.z2, 0);
})();
(function () {
    var ctx = new gcode_1.gcode.Context();
    ctx.executeBlock(gcode_1.gcode.Block.parse('G3 X1 Y1 I1 F10'));
    for (var i = 0, it; (it = ctx.lines[i]); i++) {
        console.log(it);
        assert(0 <= it.x2 && it.x2 <= 1);
        assert(0 <= it.y2 && it.y2 <= 1);
        assert(it.y2 <= it.x2);
        assert(it.z2 === 0);
    }
    var last = ctx.lines[ctx.lines.length - 1];
    assert.equal(last.x2, 1);
    assert.equal(last.y2, 1);
    assert.equal(last.z2, 0);
})();
//var ctx = new Context();
//ctx.executeBlock(Block.parse('G00 X0.000 Y0.000 F500 (movemovemvoe)\n'));
//ctx.executeBlock(Block.parse('G1 X10.000 Y10.000 Z10\n'));
//ctx.executeBlock(Block.parse('X0 Y0'));
//ctx.executeBlock(Block.parse('G4 P0.5'));
//
//ctx.executeBlock(Block.parse('G0 X0 Y0'));
//ctx.executeBlock(Block.parse('G2 X1 Y1 I1 F10 (clockwise arc in the XY plane)'));
//
//ctx.executeBlock(Block.parse('G0 X0 Y0'));
//ctx.executeBlock(Block.parse('G2 X0 Y1 I1 J0.5 F25 (clockwise arc in the XY plane)'));
//ctx.executeBlock(Block.parse('G3 X0 Y0 I1 J-0.5 F25 (counterclockwise arc in the XY plane)'));
//
//ctx.executeBlock(Block.parse('G0 X0 Y0 Z0'));
//ctx.executeBlock(Block.parse('G17 G2 X10 Y16 I3 J4 Z-1 (helix arc with Z added)'));
//
// console.log(ctx.lines);
//var fs = require('fs');
//var gcode = fs.readFileSync('sketch/test.gcode', 'utf-8');
//
//console.log(gcode);
//
//var ctx = new Context();
//
//var lines = gcode.split(/\n/);
//for (var i = 0, len = lines.length; i < len; i++) {
//	ctx.executeBlock(Block.parse(lines[i]));
//}
//
//console.log(ctx.lines);
