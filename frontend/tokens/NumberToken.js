'use strict'
const StringMethods = require('../../auxiliary/StringMethods.js')
const isDigit = StringMethods.isDigit

class NumberToken {
  constructor(source) {
    // todos los numeros son enteros hasta que se 'demuestre' lo contrario
    this.kind = 'entero'
    this.text = ''
    this.lineNumber = source._currentLineIndex
    this.columnNumber = source._currentCharIndex
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

    if (c === '.') {
      this.text += '.'
      source.nextChar()
      if ( isDigit(source.currentChar()) ) {
        while ( isDigit(c = source.currentChar()) ) {
          this.text += c
          source.nextChar()
        }
        this.kind = 'real'
      }
      else {
        this.kind = 'LEXICAL_ERROR'
        this.unexpectedChar = source.currentChar()
        this.expectedChar   = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        this.atLine         = source._currentLineIndex
        this.atColumn       = source._currentCharIndex
        this.reason         = 'unexpectedCharAtFloat'
      }
    }

    if (this.kind === 'entero')
      this.value = parseInt(this.text)
    else if (this.kind === 'real')
      this.value = parseFloat(this.text)
  }
}

module.exports = NumberToken
