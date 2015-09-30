'use strict'
let StringMethods = require('../auxiliary/StringMethods.js')
let NumberToken = require('./tokens/NumberToken.js')
let SpecialSymbolToken = require('./tokens/SpecialSymbolToken.js')
let StringToken = require('./tokens/StringToken.js')
let WordToken = require('./tokens/WordToken.js')
let EoFToken = require('./tokens/EoFToken.js')
let UnknownToken = require('./tokens/UnknownToken.js')

let isSpecialSymbolChar = SpecialSymbolToken.isSpecialSymbolChar
let couldBeComment       = (c) => {return c === '/'}
let isWhiteSpace        = StringMethods.isWhiteSpace
let isLetter            = StringMethods.isLetter
let isDigit             = StringMethods.isDigit

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
