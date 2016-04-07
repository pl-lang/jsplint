'use strict'

import { EoFToken, WordToken, NumberToken, StringToken, SpecialSymbolToken, UnknownToken } from './TokenTypes.js'

import { isDigit, isLetter, isWhiteSpace } from '../utility/StringMethods.js'

import SourceWrapper from './SourceWrapper.js'

const isSpecialSymbolChar = SpecialSymbolToken.isSpecialSymbolChar

/**
 * Clase para convertir una cadena en fichas.
 */
export default class Lexer {
  /**
   * Crea un Lexer.
   * @param  {source} source Fuente a utilizar para construir las fichas
   */
  constructor(source) {
    if (source) this._source = source;
  }

  tokenize(source) {
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

  // Envolturas para algunos metodos de SourceWrapper
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
    while (isWhiteSpace(this.currentChar())) {
      this.nextChar()
    }
  }

  skipCommment() {
    while (this.currentChar() !== this._source.EOL && this.currentChar() !== this._source.EOF) {
      this.nextChar()
    }
  }

  nextToken() {

    if (this.isCommentLine()) {
      this.skipCommment()
    }

    if (isWhiteSpace(this.currentChar()))
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
