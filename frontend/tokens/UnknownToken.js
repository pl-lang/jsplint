'use strict'

class UnknownToken {
  constructor(source) {
    this.kind = 'UNKNOWN_TOKEN_ERROR'
    this.errorInfo = {
        unexpectedChar  : source.currentChar()
      , atColumn        : source._currentCharIndex
      , atLine          : source._currentLineIndex
    }
  }
}
