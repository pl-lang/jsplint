'use strict'
const SpecialSymbolToken = require('./tokens/SpecialSymbolToken.js')
const StringMethods = require('../auxiliary/StringMethods.js')
const UnknownToken = require('./tokens/UnknownToken.js')
const NumberToken = require('./tokens/NumberToken.js')
const StringToken = require('./tokens/StringToken.js')
const WordToken = require('./tokens/WordToken.js')
const EoFToken = require('./tokens/EoFToken.js')

const isSpecialSymbolChar = SpecialSymbolToken.isSpecialSymbolChar
const isWhiteSpace        = StringMethods.isWhiteSpace
const isLetter            = StringMethods.isLetter
const isDigit             = StringMethods.isDigit

class Parser {
  constructor(source, messageHandler) {
    this.source = source
    if (messageHandler) {
      this.messageHandler = messageHandler
    }
  }

  // Envolturas para algunos metodos de Source
  currentChar() {
    return this.source.currentChar()
  }

  nextChar() {
    return this.source.nextChar()
  }

  peekChar() {
    return this.source.peekChar()
  }

  isCommentLine() {
    return this.currentChar() === '/' && this.peekChar() === '/'
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
    while ( this.currentChar() !== this.source.EON )
      this.nextChar()
  }

  nextToken() {

    if (isWhiteSpace(this.currentChar()) || this.isCommentLine())
      this.skipWhiteSpace()

    let c = this.currentChar()

    let result

    if (isDigit(c))
      result = new NumberToken(this.source)
    else if (isLetter(c))
      result = new WordToken(this.source)
    else if (isSpecialSymbolChar(c))
      result = new SpecialSymbolToken(this.source)
    else if (c === '"')
      result = new StringToken(this.source)
    else if (c === this.source.EOF)
      result = new EoFToken(this.source)
    else
      result = new UnknownToken(this.source)

    return result
  }
}

module.exports = Parser
