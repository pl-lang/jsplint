'use strict'

class UnknownToken {
  constructor(source) {
    this.kind = 'UNKNOWN_TOKEN_ERROR'
    this.lineNumber = source._currentLineIndex
    this.columnNumber = source._currentCharIndex
    this.extract(source)
  }

  extract(source) {
    this.errorInfo = {
        unexpectedChar  : source.currentChar()
      , atColumn        : source._currentCharIndex
      , atLine          : source._currentLineIndex
    }
    source.nextChar()
  }
}

module.exports = UnknownToken
