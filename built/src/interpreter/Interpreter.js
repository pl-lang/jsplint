'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Responsabilidades de esta clase:
 *   - Manejar la pila de llamadas
 *   - Pasar los datos leidos al modulo que los haya pedido
 *   - Pasar el retorno de un modulo B al modulo A que lo llamó
 */
/**
 * Eventos que emite:
 * 	- program-started
 * 	- program-paused
 * 	- program-finished
 * 	- evaluation-error (repite el de un Evaluator)
 */
var Evaluator_js_1 = require('./Evaluator.js');
var Emitter_js_1 = require('../utility/Emitter.js');
var Interpreter = (function (_super) {
    __extends(Interpreter, _super);
    function Interpreter(program_modules) {
        _super.call(this, ['program-started', 'program-resumed', 'program-paused', 'program-finished']);
        this._evaluator = new Evaluator_js_1.default(program_modules);
        this.running = true;
        this.paused = false;
    }
    Interpreter.prototype.run = function () {
        // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
        // una llamada a leer
        if (this.paused) {
            this.emit('program-resumed');
            this.paused = false;
            this.running = true;
        }
        else {
            this.emit('program-started');
        }
        var done = false;
        while (this.running && done == false) {
            var evaluation_report = this._evaluator.step();
            if (evaluation_report.done || evaluation_report.error) {
                done = true;
            }
            if (evaluation_report.error === false) {
                if (evaluation_report.output !== null) {
                    if (evaluation_report.output.action === 'write') {
                        this.emit('write', evaluation_report.output.value);
                    }
                    else if (evaluation_report.output.action === 'read') {
                        this.paused = true;
                        this.running = false;
                        // de momento, tengo que mandar un arreglo en los eventos de lectura
                        this.emit('read', [1]);
                    }
                }
            }
        }
        if (this.paused) {
            this.emit('program-paused');
        }
        else {
            this.emit('program-finished');
        }
    };
    Interpreter.prototype.sendReadData = function (varname_list, data) {
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
            var value = data_1[_i];
            this._evaluator.input(value);
        }
    };
    return Interpreter;
}(Emitter_js_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Interpreter;
