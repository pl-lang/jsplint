'use strict'
const SpecialSymbolToken = require('./tokens/SpecialSymbolToken.js')
const StringMethods = require('../auxiliary/StringMethods.js')
const UnknownToken = require('./tokens/UnknownToken.js')
const NumberToken = require('./tokens/NumberToken.js')
const StringToken = require('./tokens/StringToken.js')
const WordToken = require('./tokens/WordToken.js')
const EoFToken = require('./tokens/EoFToken.js')
const Source = require('./Source')

const isSpecialSymbolChar = SpecialSymbolToken.isSpecialSymbolChar
const isWhiteSpace        = StringMethods.isWhiteSpace
const isLetter            = StringMethods.isLetter
const isDigit             = StringMethods.isDigit

/**
 * Clase para convertir una cadena en fichas.
 */
class Parser {
  /**
   * Crea un Parser.
   * @param  {source} source Fuente a utilizar para construir las fichas
   */
  constructor(source) {
    if (source) this._source = source;
  }

  parse(source) {
    this.source = source;

    let tokens = [];
    let bad_tokens = [];

    let t = this.nextToken()

    while (t.kind !== 'eof') {
      if (t.kind == 'LEXICAL_ERROR') {
        bad_tokens.push(t);
      } else {
        tokens.push(t)
      }
      t = this.nextToken()
    }
    tokens.push(t)

    if (bad_tokens.length > 0) {
      let result = bad_tokens;
      let error = true;
      return {error, result};
    } else {
      let result = tokens;
      let error = false;
      return {error, result};
    }
  }

  // Envolturas para algunos metodos de Source
  currentChar() {
    return this._source.currentChar()
  }

  nextChar() {
    return this._source.nextChar()
  }

  peekChar() {
    return this._source.peekChar()
  }

  isCommentLine() {
    return this.currentChar() === '/' && this.peekChar() === '/'
  }

  set source(source_wrapper) {
    this._source = source_wrapper
  }

  get source() {
    return this._source
  }

  skipWhiteSpace() {
    let comment = false
    while( isWhiteSpace(this.currentChar()) || (comment = this.isCommentLine()) )
      if (comment) {
        this.skipCommment()
        comment = false
      }
      else
        this.nextChar()
  }

  skipCommment() {
    while ( this.currentChar() !== this._source.EON )
      this.nextChar()
  }

  nextToken() {

    if (isWhiteSpace(this.currentChar()) || this.isCommentLine())
      this.skipWhiteSpace()

    let c = this.currentChar()

    let result

    if (isDigit(c))
      result = new NumberToken(this._source)
    else if (isLetter(c))
      result = new WordToken(this._source)
    else if (isSpecialSymbolChar(c))
      result = new SpecialSymbolToken(this._source)
    else if (c === '"')
      result = new StringToken(this._source)
    else if (c === this._source.EOF)
      result = new EoFToken(this._source)
    else
      result = new UnknownToken(this._source)

    return result
  }
}

module.exports = Parser
