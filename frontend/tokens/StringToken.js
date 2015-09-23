'use strict'

class StringToken {
  constructor(source) {
    this.kind = 'string'
    this.value = ''
    this.lineNumber = source._currentLineIndex
    this.columnNumer = source._currentCharIndex
    this.extract(source)
  }

  extract(source) {
    // uso nextChar() en lugar de current xq no quiero que la " forme parte
    // de esta cadena
    this.value += source.nextChar()
    source.nextChar()

    let c
    while ( (c = source.currentChar()) !== '"' && c !== '\n' ) {
      this.value += c
      source.nextChar()
    }

    if (c === '"')
      this.text = '"' + this.value + '"'
    else {
      this.kind = 'LEXICAL_ERROR'
      this.errorInfo = {
          unexpectedChar  : '\n'
        , atColumn        : source._currentCharIndex
        , atLine          : source._currentLineIndex
      }
    }
  }
}

module.exports = StringToken
