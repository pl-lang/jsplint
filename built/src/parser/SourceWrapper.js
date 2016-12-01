"use strict";
var EOF_REACHED = -2;
var EOL_REACHED = -1;
var READING = 0;
var SourceWrapper = (function () {
    function SourceWrapper(string) {
        this.EOL = '\n';
        this.EOF = String.fromCharCode(0);
        this._source = string.replace(/\r/g, '');
        this._index = 0;
        this._current_column = 0;
        this._current_line = 0;
        this.updateState();
    }
    SourceWrapper.prototype.currentChar = function () {
        if (this.state === EOF_REACHED) {
            return this.EOF;
        }
        else {
            return this._source[this._index];
        }
    };
    SourceWrapper.prototype.nextChar = function () {
        this._index++;
        this.updateState();
        this.updatePosition();
        return this.currentChar();
    };
    SourceWrapper.prototype.peekChar = function () {
        if (this._index + 1 === this._source.length) {
            return this.EOF;
        }
        else {
            return this._source[this._index + 1];
        }
    };
    SourceWrapper.prototype.updateState = function () {
        if (this._index === this._source.length) {
            this.state = EOF_REACHED;
        }
        else {
            this.state = READING;
        }
    };
    SourceWrapper.prototype.updatePosition = function () {
        if (this._source[this._index - 1] === this.EOL) {
            this._current_line++;
            this._current_column = 0;
        }
        else {
            this._current_column++;
        }
    };
    return SourceWrapper;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SourceWrapper;
