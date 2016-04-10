'use strict'

import { isDigit, isLetter } from '../utility/StringMethods.js'

export class EoFToken {
  constructor(source) {
    this.kind = 'eof'
    if (source) {
      this.columnNumber = source._current_column
      this.lineNumber   = source._current_line
    }
  }
}

export class NumberToken {
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
        this.line         = source._current_line
        this.column       = source._current_column
        this.reason         = 'unexpectedCharAtFloat'
      }
    }

    if (this.kind === 'entero')
      this.value = parseInt(this.text)
    else if (this.kind === 'real')
      this.value = parseFloat(this.text)
  }
}

export class SpecialSymbolToken {
  constructor(source) {
    this.lineNumber = source._current_line
    this.columnNumber = source._current_column
    this.extract(source)
  }

  static isSpecialSymbolChar(c) {
    switch (c) {
      case '+':
      case '-':
      case '/':
      case '*':
      case '^':
      case '=':
      case '<':
      case '>':
      case '(':
      case ')':
      case '[':
      case ']':
      case ',':
      case '\n':
        return true
      default:
        return false
    }
  }

  extract(source) {
    this.text = source.currentChar()

    switch (this.text) {
      case '+':
        this.kind = 'plus'
        break
      case '-':
        this.kind = 'minus'
        break
      case '/':
        this.kind = 'divide'
        break
      case '*':
        this.kind = 'times'
        break
      case '^':
        this.kind = 'power'
        break
      case '<':
        {
          let peek = source.peekChar()
          switch (peek) {
            case '-':
              this.kind = 'assignment'
              this.text += source.nextChar()
              break
            case '=':
              this.kind = 'minor-equal'
              this.text += source.nextChar()
              break
            case '>':
              this.kind = 'diff-than'
              this.text += source.nextChar()
              break
            default:
              this.kind = 'minor-than'
              break
          }
        }
        break
      case '>':
        {
          let peek = source.peekChar()
          if (peek === '=') {
            this.kind = 'major-equal'
            this.text += source.nextChar()
          }
          else
            this.kind = 'major-than'
        }
        break
      case '=':
        this.kind = 'equal'
        break
      case '(':
        this.kind = 'left-par'
        break
      case ')':
        this.kind = 'right-par'
        break
      case '[':
        this.kind = 'left-bracket'
        break
      case ']':
        this.kind = 'right-bracket'
        break
      case ',':
        this.kind = 'comma'
        break
      case '\n':
        this.kind = 'eol'
        break
    }
    // consumir el caracer actual
    source.nextChar()
  }
}

export class StringToken {
  constructor(source) {
    this.kind = 'string'
    this.value = ''
    this.lineNumber = source._current_line
    this.columnNumer = source._current_column
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
      this.column = source._current_column
      this.line = source._current_line
      this.reason = 'unexpectedCharAtString'
    }

    // Consumo un caracter para dejar a currentChar() uno delante de la
    // " o del \n
    source.nextChar()
  }
}

function isReservedWord(word) {
  switch (word.length) {
    case 2:
      switch (word) {
        case 'si':
        case 'or':
          return true
        default:
          return false
      }
    case 3:
      switch (word) {
        case 'fin':
        case 'que':
        case 'div':
        case 'and':
        case 'not':
        case 'mod':
          return true
        default:
          return false
      }
    case 4:
      switch (word) {
        case 'sino':
        case 'para':
        case 'real':
          return true
        default:
          return false
      }
    case 5:
      switch (word) {
        case 'finsi':
        case 'hasta':
        case 'hasta':
        case 'falso':
          return true
        default:
          return false
      }
    case 6:
      switch (word) {
        case 'inicio':
        case 'entero':
        case 'logico':
          return true
        default:
          return false
      }
    case 7:
      switch (word) {
        case 'finpara':
        case 'repetir':
        case 'funcion':
          return true
        default:
          return false
      }
    case 8:
      switch (word) {
        case 'entonces':
        case 'mientras':
        case 'caracter':
          return true
        default:
          return false
      }
    case 9:
      switch (word) {
        case 'variables':
        case 'verdadero':
          return true
        default:
          return false
      }
    case 10:
      switch (word) {
        case 'finfuncion':
          return true
        default:
          return false
      }
    case 11:
      switch (word) {
        case 'finmientras':
          return true
        default:
          return false
      }
    case 13:
      switch (word) {
        case 'procedimiento':
          return true
        default:
          return false
      }
    case 16:
      switch (word) {
        case 'finprocedimiento':
          return true
        default:
          return false
      }
    default:
      return false
  }
}

export class WordToken {
  constructor(source) {
    this.kind = 'word'
    this.text = ''
    this.lineNumber = source._current_line
    this.columnNumber = source._current_column
    this.extract(source)
  }

  extract(source) {
    //agrega el primer caracter del token
    this.text += source.currentChar()
    source.nextChar()

    let isDigitOrLetter = (s) => {return isDigit(s) || isLetter(s) || s === '_'}

    let c
    while ( isDigitOrLetter(c = source.currentChar()) ) {
      this.text += c
      source.nextChar()
    }

    if (isReservedWord(this.text.toLowerCase()))
      this.kind = this.text.toLowerCase()
  }
}

export class UnknownToken {
  constructor(source) {
    this.kind = 'LEXICAL_ERROR'
    this.unexpectedChar = source.currentChar()
    this.line = source._current_line
    this.column = source._current_column
    this.reason = 'unknownToken'
    source.nextChar()
  }
}
