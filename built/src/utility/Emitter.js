'use strict';
var Emitter = (function () {
    function Emitter(public_event_list) {
        this.public_events = public_event_list;
        this.callbacks = {};
    }
    Emitter.prototype.on = function (event_name, callback) {
        if (event_name in this.callbacks) {
            this.callbacks[event_name].push(callback);
        }
        else {
            this.callbacks[event_name] = [callback];
        }
    };
    /**
     * Se encarga de llamar a los callbacks de los eventos.
     * Si se registro un callback para 'any' entonces se lo llama para cada evento que sea emitido. Es el callback por defecto.
     * Si un evento tiene registrado un callback entonces este se ejecuta despues del callback por defecto.
     */
    Emitter.prototype.emit = function (event_name) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.callbacks.hasOwnProperty('any')) {
            for (var _a = 0, _b = this.callbacks.any; _a < _b.length; _a++) {
                var callback = _b[_a];
                callback.apply(void 0, args);
            }
        }
        if (this.callbacks.hasOwnProperty(event_name)) {
            for (var _c = 0, _d = this.callbacks[event_name]; _c < _d.length; _c++) {
                var callback = _d[_c];
                callback.apply(void 0, args);
            }
        }
    };
    /**
     * Repite un evento de otro emisor como si fuera propio. El evento puede registrar como publico o no.
     */
    Emitter.prototype.repeat = function (event_name, emitter, make_public) {
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        if (make_public === true) {
            this.public_events.push(event_name);
        }
        var self = this;
        emitter.on(event_name, function () {
            self.emit.apply(self, [event_name].concat(args));
        });
    };
    /**
     * Emitir los eventos de otro emisor como si fueran propios.
     */
    Emitter.prototype.repeatAllPublicEvents = function (emitter) {
        for (var _i = 0, _a = emitter.public_events; _i < _a.length; _i++) {
            var event_name = _a[_i];
            this.repeat(event_name, emitter, true);
        }
    };
    return Emitter;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Emitter;
