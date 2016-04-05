'use strict'

import { isDigit } from '../../misc/StringMethods.js'

export default class NumberToken {
  constructor(source) {
    // todos los numeros son enteros hasta que se 'demuestre' lo contrario
    this.kind = 'entero'
    this.text = ''
    this.lineNumber = source._current_line
    this.columnNumber = source._current_column
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
        this.atLine         = source._current_line
        this.atColumn       = source._current_column
        this.reason         = 'unexpectedCharAtFloat'
      }
    }

    if (this.kind === 'entero')
      this.value = parseInt(this.text)
    else if (this.kind === 'real')
      this.value = parseFloat(this.text)
  }
}
