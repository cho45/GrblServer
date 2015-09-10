//#!tsc --target ES5 --module commonjs gcode.ts && node gcode.js
///<reference path="./typings/bundle.d.ts"/>
var gcode;
(function (gcode) {
    var Motion = (function () {
        function Motion(prevMotion) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.prevMotion = prevMotion;
        }
        Object.defineProperty(Motion.prototype, "distance", {
            get: function () {
                var x = this.prevMotion.x - this.x;
                var y = this.prevMotion.y - this.y;
                var z = this.prevMotion.z - this.z;
                return Math.sqrt(x * x + y * y + z * z);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Motion.prototype, "duration", {
            // return second
            get: function () {
                return this.distance / this.feedRate * 60;
            },
            enumerable: true,
            configurable: true
        });
        return Motion;
    })();
    gcode.Motion = Motion;
    var Context = (function () {
        function Context() {
            var _this = this;
            this.handlers = {
                'F': function () {
                    _this.state.set(States.F, _this.code.value);
                },
                'G': function () {
                    var handler = _this.handlers[_this.code.name];
                    if (!handler) {
                        console.log('unsupported G-code ' + _this.code.name);
                        return;
                    }
                    handler();
                },
                'G0': function () {
                    _this.state.set(States.MOTION, MotionMode.G0);
                    _this.blockSub = function () {
                        _this.drawLine("G0", _this.lastMotion.x, _this.lastMotion.y, _this.lastMotion.z, _this.state.get(States.X), _this.state.get(States.Y), _this.state.get(States.Z), _this.rapidFeedRate || Infinity);
                    };
                },
                'G1': function () {
                    _this.state.set(States.MOTION, MotionMode.G1);
                    _this.blockSub = function () {
                        _this.drawLine("G1", _this.lastMotion.x, _this.lastMotion.y, _this.lastMotion.z, _this.state.get(States.X), _this.state.get(States.Y), _this.state.get(States.Z), _this.state.get(States.F));
                    };
                },
                'G2': function () {
                    _this.state.set(States.MOTION, MotionMode.G2);
                    _this.blockSub = function () {
                        _this.drawArc("G2", _this.state.get(States.PLANE), _this.lastMotion.x, _this.lastMotion.y, _this.lastMotion.z, _this.state.get(States.X), _this.state.get(States.Y), _this.state.get(States.Z), _this.state.get(States.I), _this.state.get(States.J), _this.state.get(States.K), _this.state.get(States.R), _this.state.get(States.F));
                    };
                },
                'G3': function () {
                    _this.state.set(States.MOTION, MotionMode.G3);
                    _this.blockSub = function () {
                        _this.drawArc("G3", _this.state.get(States.PLANE), _this.lastMotion.x, _this.lastMotion.y, _this.lastMotion.z, _this.state.get(States.X), _this.state.get(States.Y), _this.state.get(States.Z), _this.state.get(States.I), _this.state.get(States.J), _this.state.get(States.K), _this.state.get(States.R), _this.state.get(States.F));
                    };
                },
                'G4': function () {
                    _this.blockSub = function () {
                        var sleep = 0;
                        var P = _this.state.get(States.P);
                        if (P) {
                            sleep = P * 1000;
                        }
                        else {
                            sleep = _this.state.get(States.X);
                        }
                        console.log('sleep', sleep);
                    };
                },
                'G10': function () {
                    _this.blockSub = function () { };
                },
                'G17': function () {
                    _this.state.set(States.PLANE, PlaneMode.XY);
                },
                'G18': function () {
                    _this.state.set(States.PLANE, PlaneMode.XZ);
                },
                'G19': function () {
                    _this.state.set(States.PLANE, PlaneMode.YZ);
                },
                'G20': function () {
                    // throw "does not support inch";
                    _this.state.set(States.UNIT_MODE, UnitMode.INCH);
                    _this.blockSub = function () { };
                },
                'G21': function () {
                    _this.state.set(States.UNIT_MODE, UnitMode.MM);
                    _this.blockSub = function () { };
                },
                'G28': function () {
                    _this.blockSub = function () { };
                },
                'G28.1': function () {
                    _this.blockSub = function () { };
                },
                'G30': function () {
                    _this.blockSub = function () { };
                },
                'G38.1': function () {
                    _this.blockSub = function () { };
                },
                'G38.2': function () {
                    _this.blockSub = function () { };
                },
                'G38.3': function () {
                    _this.blockSub = function () { };
                },
                'G38.4': function () {
                    _this.blockSub = function () { };
                },
                'G38.5': function () {
                    _this.blockSub = function () { };
                },
                'G40': function () {
                    _this.blockSub = function () { };
                },
                'G43.1': function () {
                    _this.blockSub = function () { };
                },
                'G49': function () {
                    _this.blockSub = function () { };
                },
                'G53': function () {
                    _this.blockSub = function () { };
                },
                'G54': function () {
                    _this.blockSub = function () { };
                },
                'G55': function () {
                    _this.blockSub = function () { };
                },
                'G56': function () {
                    _this.blockSub = function () { };
                },
                'G57': function () {
                    _this.blockSub = function () { };
                },
                'G58': function () {
                    _this.blockSub = function () { };
                },
                'G59': function () {
                    _this.blockSub = function () { };
                },
                'G61': function () {
                    _this.blockSub = function () { };
                },
                'G80': function () {
                    _this.state.set(States.MOTION, MotionMode.UNDEFINED);
                    _this.blockSub = function () { };
                },
                'G90': function () {
                    _this.state.set(States.DISTANCE_MODE, DistanceMode.ABSOLUTE);
                },
                'G91': function () {
                    _this.state.set(States.DISTANCE_MODE, DistanceMode.RELATIVE);
                },
                'G91.1': function () {
                    _this.blockSub = function () { };
                },
                'G92': function () {
                    _this.blockSub = function () { };
                },
                'G92.1': function () {
                    _this.blockSub = function () { };
                },
                'G93': function () {
                    // TODO not supported yet
                    _this.state.set(States.FEED_RATE_MODE, FeedRateMode.INVERSE_TIME);
                },
                'G94': function () {
                    _this.state.set(States.FEED_RATE_MODE, FeedRateMode.UNITS_PER_MINUTE);
                },
                'I': function () {
                    _this.state.setLengthValue(States.I, _this.code.value);
                },
                'J': function () {
                    _this.state.setLengthValue(States.J, _this.code.value);
                },
                'K': function () {
                    _this.state.setLengthValue(States.K, _this.code.value);
                },
                'M': function () {
                    var handler = _this.handlers[_this.code.name];
                    if (!handler) {
                        console.log('unsupported M-code ' + _this.code.name);
                        return;
                    }
                    handler();
                },
                'M0': function () {
                    _this.blockSub = function () { };
                },
                'M1': function () {
                    _this.blockSub = function () { };
                },
                'M2': function () {
                    _this.blockSub = function () { };
                },
                'M3': function () {
                    _this.blockSub = function () { };
                },
                'M4': function () {
                    _this.blockSub = function () { };
                },
                'M5': function () {
                    _this.blockSub = function () { };
                },
                'M6': function () {
                    _this.blockSub = function () { };
                },
                'M7': function () {
                    _this.blockSub = function () { };
                },
                'M8': function () {
                    _this.blockSub = function () { };
                },
                'M9': function () {
                    _this.blockSub = function () { };
                },
                'M10': function () {
                    _this.blockSub = function () { };
                },
                'M11': function () {
                    _this.blockSub = function () { };
                },
                'M30': function () {
                    _this.blockSub = function () { };
                },
                'N': function () {
                    _this.state.set(States.LINE_NUMBER, _this.code.value);
                },
                'P': function () {
                    _this.state.set(States.P, _this.code.value);
                },
                'R': function () {
                    _this.state.setLengthValue(States.R, _this.code.value);
                },
                'S': function () {
                    _this.state.set(States.S, _this.code.value);
                },
                'T': function () {
                    _this.state.set(States.T, _this.code.value);
                },
                'X': function () {
                    _this.state.setAxisValue(States.X, _this.code.value);
                },
                'Y': function () {
                    _this.state.setAxisValue(States.Y, _this.code.value);
                },
                'Z': function () {
                    _this.state.setAxisValue(States.Z, _this.code.value);
                },
            };
            this.state = new State(null);
            this.motions = [new Motion(null)];
        }
        Object.defineProperty(Context.prototype, "lastMotion", {
            get: function () {
                if (this.motions.length) {
                    return this.motions[this.motions.length - 1];
                }
                else {
                    return null;
                }
            },
            enumerable: true,
            configurable: true
        });
        Context.prototype.executeBlock = function (block) {
            var motionIndex = this.motions.length - 1;
            this.prevState = this.state;
            this.state = new State(this.prevState);
            this.blockSub = null;
            for (var i = 0, it = void 0; (it = block.codes[i]); i++) {
                var handler = this.handlers[it.letter];
                if (!handler) {
                    console.log('warning ' + it.letter + ' handler is missing');
                    continue;
                }
                this.code = it;
                handler();
            }
            // implicit move
            if (!this.blockSub) {
                var implicitHandler = this.handlers[this.state.get(States.MOTION)];
                if (implicitHandler) {
                    implicitHandler();
                }
            }
            if (this.blockSub) {
                this.blockSub();
                this.blockSub = null;
            }
            this.state.clearModeless();
            var elapsed = 0;
            if (motionIndex > 0) {
                for (var i = motionIndex, it = void 0; (it = this.motions[i]); i++) {
                    elapsed += it.duration;
                }
            }
            return elapsed;
        };
        Context.prototype.drawLine = function (type, x1, y1, z1, x2, y2, z2, feedRate) {
            var line = new Motion(this.lastMotion);
            line.type = type;
            line.x = x2;
            line.y = y2;
            line.z = z2;
            line.feedRate = feedRate;
            this.motions.push(line);
        };
        Context.prototype.drawArc = function (type, plain, x1, y1, z1, x2, y2, z2, xOffset, yOffset, zOffset, radius, feedRate) {
            var _this = this;
            var isClockWise = type === 'G2';
            var drawLine;
            if (plain === PlaneMode.XZ) {
                _a = [x1, z1, y1], x1 = _a[0], y1 = _a[1], z1 = _a[2];
                _b = [x2, z2, y2], x2 = _b[0], y2 = _b[1], z2 = _b[2];
                _c = [xOffset, zOffset, yOffset], xOffset = _c[0], yOffset = _c[1], zOffset = _c[2];
                drawLine = function (type, xx, yy, zz, x, y, z, feedRate) {
                    _this.drawLine(type, xx, zz, yy, x, z, y, feedRate);
                };
            }
            else if (plain === PlaneMode.YZ) {
                _d = [y1, z1, x1], x1 = _d[0], y1 = _d[1], z1 = _d[2];
                _e = [y2, z2, x2], x2 = _e[0], y2 = _e[1], z2 = _e[2];
                _f = [yOffset, zOffset, xOffset], xOffset = _f[0], yOffset = _f[1], zOffset = _f[2];
                drawLine = function (type, xx, yy, zz, x, y, z, feedRate) {
                    _this.drawLine(type, zz, xx, yy, z, x, y, feedRate);
                };
            }
            else {
                // PlaneMode.XY
                drawLine = function (type, xx, yy, zz, x, y, z, feedRate) {
                    _this.drawLine(type, xx, yy, zz, x, y, z, feedRate);
                };
            }
            if (radius) {
                var x = x2 - x1;
                var y = y2 - y1;
                // calculate offset
                var distance = Math.sqrt(x * x + y * y);
                var height = Math.sqrt(4 * radius * radius - x * x - y * y) / 2;
                if (isClockWise) {
                    height = -height;
                }
                if (radius < 0) {
                    height = -height;
                }
                xOffset = x / 2 - y / distance * height;
                yOffset = y / 2 + x / distance * height;
            }
            var centerX = x1 + xOffset;
            var centerY = y1 + yOffset;
            var radius = Math.sqrt(Math.pow(centerX - x1, 2) + Math.pow(centerY - y1, 2));
            var angle1 = (Math.atan2((y1 - centerY), (x1 - centerX)) + Math.PI * 2) % (Math.PI * 2);
            var angle2 = (Math.atan2((y2 - centerY), (x2 - centerX)) + Math.PI * 2) % (Math.PI * 2);
            if (angle2 <= angle1) {
                angle2 += Math.PI * 2;
            }
            // calculate ccw angle
            var angleDelta = angle2 - angle1;
            // and consider cw
            if (isClockWise) {
                angleDelta = -Math.PI * 2 + angleDelta;
            }
            var xx = x1, yy = y1, zz = z1;
            for (var i = 0, points = 30; i < points; i++) {
                var angle = angle1 + (angleDelta / points * i);
                var x = Math.cos(angle) * radius + centerX;
                var y = Math.sin(angle) * radius + centerY;
                var z = (z2 - z1) / points * i + z1;
                drawLine(type, xx, yy, zz, x, y, z, feedRate);
                xx = x, yy = y, zz = z;
            }
            drawLine(type, xx, yy, zz, x2, y2, z2, feedRate);
            var _a, _b, _c, _d, _e, _f;
        };
        return Context;
    })();
    gcode.Context = Context;
    var States;
    (function (States) {
        States[States["MOTION"] = 'MOTION'] = "MOTION";
        States[States["UNIT_MODE"] = 'UNIT_MODE'] = "UNIT_MODE";
        States[States["DISTANCE_MODE"] = 'DISTANCE_MODE'] = "DISTANCE_MODE";
        States[States["LINE_NUMBER"] = 'LINE_NUMBER'] = "LINE_NUMBER";
        States[States["FEED_RATE_MODE"] = 'FEED_RATE_MODE'] = "FEED_RATE_MODE";
        States[States["PLANE"] = 'PLANE'] = "PLANE";
        States[States["F"] = 'F'] = "F";
        States[States["I"] = 'I'] = "I";
        States[States["J"] = 'J'] = "J";
        States[States["K"] = 'K'] = "K";
        States[States["L"] = 'L'] = "L";
        States[States["N"] = 'N'] = "N";
        States[States["P"] = 'P'] = "P";
        States[States["R"] = 'R'] = "R";
        States[States["S"] = 'S'] = "S";
        States[States["T"] = 'T'] = "T";
        States[States["X"] = 'X'] = "X";
        States[States["Y"] = 'Y'] = "Y";
        States[States["Z"] = 'Z'] = "Z";
    })(States || (States = {}));
    var MotionMode;
    (function (MotionMode) {
        MotionMode[MotionMode["UNDEFINED"] = 'UNDEFINED'] = "UNDEFINED";
        MotionMode[MotionMode["G0"] = 'G0'] = "G0";
        MotionMode[MotionMode["G1"] = 'G1'] = "G1";
        MotionMode[MotionMode["G2"] = 'G2'] = "G2";
        MotionMode[MotionMode["G3"] = 'G3'] = "G3";
    })(MotionMode || (MotionMode = {}));
    var UnitMode;
    (function (UnitMode) {
        UnitMode[UnitMode["MM"] = 'MM'] = "MM";
        UnitMode[UnitMode["INCH"] = 'INCH'] = "INCH";
    })(UnitMode || (UnitMode = {}));
    var DistanceMode;
    (function (DistanceMode) {
        DistanceMode[DistanceMode["ABSOLUTE"] = 'ABSOLUTE'] = "ABSOLUTE";
        DistanceMode[DistanceMode["RELATIVE"] = 'RELATIVE'] = "RELATIVE";
    })(DistanceMode || (DistanceMode = {}));
    var PlaneMode;
    (function (PlaneMode) {
        PlaneMode[PlaneMode["XY"] = 'XY'] = "XY";
        PlaneMode[PlaneMode["XZ"] = 'XZ'] = "XZ";
        PlaneMode[PlaneMode["YZ"] = 'YZ'] = "YZ";
    })(PlaneMode || (PlaneMode = {}));
    var FeedRateMode;
    (function (FeedRateMode) {
        FeedRateMode[FeedRateMode["INVERSE_TIME"] = 'INVERSE_TIME'] = "INVERSE_TIME";
        FeedRateMode[FeedRateMode["UNITS_PER_MINUTE"] = 'UNITS_PER_MINUTE'] = "UNITS_PER_MINUTE";
    })(FeedRateMode || (FeedRateMode = {}));
    var State = (function () {
        function State(state) {
            this._values = {};
            if (state) {
                // copy values
                for (var key in state._values)
                    if (state._values.hasOwnProperty(key)) {
                        this._values[key] = state._values[key];
                    }
            }
            else {
                this._values[States.I] = 0;
                this._values[States.J] = 0;
                this._values[States.K] = 0;
                this._values[States.X] = 0;
                this._values[States.Y] = 0;
                this._values[States.Z] = 0;
                this._values[States.MOTION] = MotionMode.UNDEFINED;
                this._values[States.UNIT_MODE] = UnitMode.MM;
                this._values[States.DISTANCE_MODE] = DistanceMode.ABSOLUTE;
                this._values[States.PLANE] = PlaneMode.XY;
                this._values[States.FEED_RATE_MODE] = FeedRateMode.UNITS_PER_MINUTE;
            }
            this._updated = {};
        }
        State.prototype.set = function (name, value) {
            if (this._updated[name]) {
                throw name + " is already updated";
            }
            this._values[name] = value;
            this._updated[name] = true;
        };
        State.prototype.setAxisValue = function (name, value) {
            if (this.get(States.DISTANCE_MODE) === DistanceMode.RELATIVE) {
                value += this.get(name);
            }
            this.setLengthValue(name, value);
        };
        State.prototype.setLengthValue = function (name, value) {
            if (this.get(States.UNIT_MODE) === UnitMode.INCH) {
                value = value * 25.4;
            }
            this.set(name, value);
        };
        State.prototype.get = function (name) {
            return this._values[name];
        };
        State.prototype.clearModeless = function () {
            delete this._values[States.P];
            delete this._values[States.R];
        };
        return State;
    })();
    gcode.State = State;
    var Code = (function () {
        function Code(letter, value) {
            this.letter = letter;
            this.value = value;
        }
        Object.defineProperty(Code.prototype, "name", {
            get: function () {
                return this.letter + String(this.value);
            },
            enumerable: true,
            configurable: true
        });
        return Code;
    })();
    gcode.Code = Code;
    var Block = (function () {
        function Block() {
            this.codes = [];
        }
        Block.parse = function (str) {
            str = str.replace(/\([^)]+\)/g, '');
            str = str.replace(/;.*/g, '');
            str = str.replace(/\s+/g, '');
            str = str.replace(/%/g, '');
            str = str.toUpperCase();
            var block = new Block();
            str = str.replace(/([A-Z])(-?[0-9.]+)/g, function (_, letter, value) {
                block.addCode(new Code(letter, +value));
                return '';
            });
            if (str)
                throw "unexpected token in this line: " + str;
            return block;
        };
        Block.prototype.addCode = function (code) {
            this.codes.push(code);
        };
        return Block;
    })();
    gcode.Block = Block;
})(gcode = exports.gcode || (exports.gcode = {}));
