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
      this.unexpectedChar = '\n'
      this.expectedChar = ['caracteres', '"']
      this.atColumn = source._currentCharIndex
      this.atLine = source._currentLineIndex
      this.reason = 'unexpectedCharAtString'
    }

    // Consumo un caracter para dejar a currentChar() uno delante de la
    // " o del \n
    source.nextChar()
  }
}

module.exports = StringToken
