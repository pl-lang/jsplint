'use strict'

import { Token, EoFToken, WordToken, NumberToken, StringToken, SpecialSymbolToken, UnknownToken, SymbolKind } from './TokenTypes'

import { LexicalError } from './TokenTypes'

import {IError, ISuccess} from '../interfaces/Utility'

import { isDigit, isLetter, isWhiteSpace } from '../utility/StringMethods'

import SourceWrapper from './SourceWrapper'

const isSpecialSymbolChar = SpecialSymbolToken.isSpecialSymbolChar

/**
 * Clase para convertir una cadena en fichas.
 */
export default class Lexer {
  _source : SourceWrapper

  /**
   * Crea un Lexer.
   * @param  {source} source Fuente a utilizar para construir las fichas
   */
  constructor(source ?: SourceWrapper) {
    if (source) this._source = source;
  }

  tokenize(source : SourceWrapper) : IError<LexicalError[]> | ISuccess<Token[]> {
    this.source = source;

    const tokens : Token[] = [];
    const bad_tokens_info : LexicalError[] = [];

    let t = this.nextToken()

    while (t.kind !== SymbolKind.EOF) {
      if (t.error_found) {
        bad_tokens_info.push(t.error_info);
      } else {
        tokens.push(t)
      }
      t = this.nextToken()
    }
    tokens.push(t)

    if (bad_tokens_info.length > 0) {
      return {error: true, result: bad_tokens_info}
    } else {
      return {error: false, result: tokens};
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

    let result : Token

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
