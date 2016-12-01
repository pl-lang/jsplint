'use strict';
var TokenTypes_1 = require('./TokenTypes');
var StringMethods_1 = require('../utility/StringMethods');
var isSpecialSymbolChar = TokenTypes_1.SpecialSymbolToken.isSpecialSymbolChar;
/**
 * Clase para convertir una cadena en fichas.
 */
var Lexer = (function () {
    /**
     * Crea un Lexer.
     * @param  {source} source Fuente a utilizar para construir las fichas
     */
    function Lexer(source) {
        if (source)
            this._source = source;
    }
    Lexer.prototype.tokenize = function (source) {
        this.source = source;
        var tokens = [];
        var bad_tokens_info = [];
        var t = this.nextToken();
        while (t.kind !== TokenTypes_1.SymbolKind.EOF) {
            if (t.error_found) {
                bad_tokens_info.push(t.error_info);
            }
            else {
                tokens.push(t);
            }
            t = this.nextToken();
        }
        tokens.push(t);
        if (bad_tokens_info.length > 0) {
            return { error: true, result: bad_tokens_info };
        }
        else {
            return { error: false, result: tokens };
        }
    };
    // Envolturas para algunos metodos de SourceWrapper
    Lexer.prototype.currentChar = function () {
        return this._source.currentChar();
    };
    Lexer.prototype.nextChar = function () {
        return this._source.nextChar();
    };
    Lexer.prototype.peekChar = function () {
        return this._source.peekChar();
    };
    Lexer.prototype.isCommentLine = function () {
        return this.currentChar() === '/' && this.peekChar() === '/';
    };
    Object.defineProperty(Lexer.prototype, "source", {
        get: function () {
            return this._source;
        },
        set: function (source_wrapper) {
            this._source = source_wrapper;
        },
        enumerable: true,
        configurable: true
    });
    Lexer.prototype.skipWhiteSpace = function () {
        while (StringMethods_1.isWhiteSpace(this.currentChar())) {
            this.nextChar();
        }
    };
    Lexer.prototype.skipCommment = function () {
        while (this.currentChar() !== this._source.EOL && this.currentChar() !== this._source.EOF) {
            this.nextChar();
        }
    };
    Lexer.prototype.nextToken = function () {
        if (this.isCommentLine()) {
            this.skipCommment();
        }
        if (StringMethods_1.isWhiteSpace(this.currentChar()))
            this.skipWhiteSpace();
        var c = this.currentChar();
        var result;
        if (StringMethods_1.isDigit(c))
            result = new TokenTypes_1.NumberToken(this._source);
        else if (StringMethods_1.isLetter(c))
            result = new TokenTypes_1.WordToken(this._source);
        else if (isSpecialSymbolChar(c))
            result = new TokenTypes_1.SpecialSymbolToken(this._source);
        else if (c === '"')
            result = new TokenTypes_1.StringToken(this._source);
        else if (c === this._source.EOF)
            result = new TokenTypes_1.EoFToken(this._source);
        else
            result = new TokenTypes_1.UnknownToken(this._source);
        return result;
    };
    return Lexer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Lexer;
