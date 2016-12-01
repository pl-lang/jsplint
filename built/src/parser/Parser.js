'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Emitter_1 = require('../utility/Emitter');
var SourceWrapper_1 = require('./SourceWrapper');
var Lexer_1 = require('./Lexer');
var TokenQueue_1 = require('./TokenQueue');
var Patterns_1 = require('./Patterns');
var Patterns_2 = require('./Patterns');
var Parser = (function (_super) {
    __extends(Parser, _super);
    function Parser() {
        _super.call(this, ['parsing-started', 'lexical-error', 'syntax-error', 'parsing-finished']);
    }
    Parser.prototype.parse = function (code) {
        this.emit('parsing-started');
        var source = new SourceWrapper_1.default(code);
        var lexer = new Lexer_1.default();
        var lexer_report = lexer.tokenize(source);
        // emitir eventos de error si hubo alguno y finalizar parseo
        if (lexer_report.error) {
            for (var _i = 0, _a = lexer_report.result; _i < _a.length; _i++) {
                var error_report = _a[_i];
                this.emit('lexical-error', error_report);
            }
            this.emit('parsing-finished', { error: true, result: 'lexical-error' });
            return { error: true, result: 'lexical-error' };
        }
        var token_queue = new TokenQueue_1.default(lexer_report.result);
        Patterns_1.skipWhiteSpace(token_queue);
        // buscar el modulo principal
        var main_match = Patterns_1.MainModule(token_queue);
        if (main_match.error) {
            this.emit('syntax-error', main_match.result);
            return { error: true, result: 'syntax-error' };
        }
        var result = {
            main: main_match.result
        };
        // parsear el resto de los modulos del programa
        while (token_queue.current().name !== 'eof') {
            Patterns_1.skipWhiteSpace(token_queue);
            var module_match = void 0;
            if (token_queue.current().name == 'procedimiento') {
                module_match = Patterns_2.ProcedureModule(token_queue);
            }
            else {
                module_match = Patterns_2.FunctionModule(token_queue);
            }
            Patterns_1.skipWhiteSpace(token_queue);
            // si hubo un error emitir un error de sintaxis y finalizar parseo
            if (module_match.error) {
                this.emit('syntax-error', module_match.result);
                return { error: true, result: 'syntax-error' };
            }
            else {
                result[module_match.result.name] = module_match.result;
            }
        }
        this.emit('parsing-finished', { error: false });
        return { error: false, result: result };
    };
    return Parser;
}(Emitter_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Parser;
