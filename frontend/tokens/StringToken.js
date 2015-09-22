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
      this.kind = 'error'
      this.message = 'No esperaba \\n'
    }
  }
}

module.exports = StringToken
