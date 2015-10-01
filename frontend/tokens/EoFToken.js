'use strict'

class EoFToken {
  constructor(source) {
    this.kind = 'eof'
    if (source) {
      this.columnNumber = source._currentCharIndex
      this.lineNumber   = source._currentLineIndex
    }
  }
}

module.exports = EoFToken
