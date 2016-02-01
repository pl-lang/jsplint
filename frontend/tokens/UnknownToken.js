'use strict'

class UnknownToken {
  constructor(source) {
    this.kind = 'LEXICAL_ERROR'
    this.unexpectedChar = source.currentChar()
    this.atLine = source._currentLineIndex
    this.atColumn = source._currentCharIndex
    this.reason = 'unknownToken'
    source.nextChar()
  }
}

module.exports = UnknownToken
