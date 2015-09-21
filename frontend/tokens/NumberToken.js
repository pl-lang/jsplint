'use strict'

function isDigit(string) {
  return /\d/.test(string)
}

class NumberToken {
  constructor(source) {
    // todos los numeros son enteros hasta que se 'demuestre' lo contrario
    this.kind = 'integer'
    this.text = ''
    this.lineNumber = source._currentLineIndex + 1
    this.columnNumber = source._currentCharIndex + 1
    this.extract(source)
  }

  extract(source) {
    this.text += source.currentChar()
    source.nextChar()

    let c
    while ( isDigit(c = source.currentChar()) ) {
      this.text += c
      source.nextChar()
    }

    if (c === '.' && isDigit(source.peekChar())) {
      this.text += '.'
      source.nextChar()
      while ( isDigit(c = source.currentChar()) ) {
        this.text += c
        source.nextChar()
      }
      this.kind = 'float'
    }

    if (this.kind === 'integer')
      this.value = parseInt(this.text)
    else
      this.value = parseFloat(this.text)
  }
}

module.exports = NumberToken
