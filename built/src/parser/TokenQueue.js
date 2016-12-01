'use strict';
var TokenTypes_js_1 = require('./TokenTypes.js');
var TokenQueue = (function () {
    function TokenQueue(array) {
        this.tokens = array;
        this.total_elements = array.length;
        this.current_index = 0;
        this.eof_reached = false;
        this.checkpoint_set = false;
        this.checkpoints = [];
    }
    TokenQueue.prototype.current = function () {
        if (this.eof_reached) {
            return new TokenTypes_js_1.EoFToken();
        }
        else {
            return this.tokens[this.current_index];
        }
    };
    TokenQueue.prototype.next = function () {
        if (this.current_index + 1 < this.total_elements)
            ++this.current_index;
        else
            this.eof_reached = true;
        return this.current();
    };
    TokenQueue.prototype.peek = function () {
        if (this.current_index + 1 < this.total_elements)
            return this.tokens[this.current_index + 1];
        else
            return new TokenTypes_js_1.EoFToken();
    };
    TokenQueue.prototype.set_checkpoint = function () {
        this.checkpoints.push(this.current_index);
        this.checkpoint_set = true;
    };
    TokenQueue.prototype.rewind = function () {
        if (this.checkpoint_set) {
            this.current_index = this.checkpoints.pop();
            if (this.checkpoints.length == 0) {
                this.checkpoint_set = false;
            }
            if (this.eof_reached) {
                this.eof_reached = false;
            }
        }
    };
    return TokenQueue;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TokenQueue;
