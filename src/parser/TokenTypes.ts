'use strict'

import { isDigit, isLetter } from '../utility/StringMethods'
import {default as SourceWrapper} from './SourceWrapper'
import {Errors, Token, ValueKind, ReservedKind, OtherKind, SymbolKind} from '../interfaces'

export class EoFToken implements Token {
  kind : SymbolKind.EOF
  column : number
  line : number
  error_found : boolean
  error_info : Errors.Lexical
  name = 'eof'

  constructor(source ?: SourceWrapper) {
    this.kind = SymbolKind.EOF
    if (source) {
      this.column = source._current_column
      this.line   = source._current_line
    }
  }
}

export class NumberToken implements Token {
  kind : ValueKind.Integer | ValueKind.Real
  column : number
  line : number
  error_found : boolean
  error_info : Errors.Lexical
  name: string

  text: string
  value: number

  constructor(source : SourceWrapper) {
    // todos los numeros son enteros hasta que se 'demuestre' lo contrario
    this.kind = ValueKind.Integer
    this.name = 'entero'
    this.text = ''
    this.line = source._current_line
    this.column = source._current_column
    this.extract(source)
  }

  extract(source : SourceWrapper) {
    this.text += source.currentChar()
    source.nextChar()

    let c : string
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
        this.kind = ValueKind.Real
        this.name = 'real'
      }
      else {
        this.error_found = true
        this.error_info = {
          unexpected: source.currentChar(),
          expected: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
          pos: {line: source._current_line, column: source._current_column},
          reason: 'unexpectedCharAtFloat',
          where: 'lexer'
        }
      }
    }

    if (this.kind === ValueKind.Integer)
      this.value = parseInt(this.text)
    else if (this.kind === ValueKind.Real)
      this.value = parseFloat(this.text)
  }
}

export class SpecialSymbolToken implements Token {
  kind : SymbolKind
  column : number
  line : number
  error_found : boolean
  error_info : Errors.Lexical
  name: string

  text : string

  constructor(source : SourceWrapper) {
    this.line = source._current_line
    this.column = source._current_column
    this.extract(source)
  }

  static isSpecialSymbolChar(c : string) {
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

  extract(source : SourceWrapper) {
    this.text = source.currentChar()

    switch (this.text) {
      case '+':
        this.kind = SymbolKind.Plus
        this.name = 'plus'
        break
      case '-':
        this.kind = SymbolKind.Minus
        this.name = 'minus' 
        break
      case '/':
        this.kind = SymbolKind.Slash
        this.name = 'slash' 
        break
      case '*':
        this.kind = SymbolKind.Times
        this.name = 'times' 
        break
      case '^':
        this.kind = SymbolKind.Power
        this.name = 'power'
        break
      case '<':
        {
          let peek = source.peekChar()
          switch (peek) {
            case '-':
              this.kind = SymbolKind.Assignment
              this.name = 'assignment'
              this.text += source.nextChar()
              break
            case '=':
              this.kind = SymbolKind.MinorEq
              this.name = 'minor-eq'
              this.text += source.nextChar()
              break
            case '>':
              this.kind = SymbolKind.Different
              this.name = 'different'
              this.text += source.nextChar()
              break
            default:
              this.kind = SymbolKind.Minor
              this.name = 'minor'
              break
          }
        }
        break
      case '>':
        {
          const peek = source.peekChar()
          if (peek === '=') {
            this.kind = SymbolKind.MajorEq
            this.name = 'major-eq' 
            this.text += source.nextChar()
          }
          else {
            this.kind = SymbolKind.Major
            this.name = 'major'
          }
        }
        break
      case '=':
        this.kind = SymbolKind.Equal
        this.name = 'equal'
        break
      case '(':
        this.kind = SymbolKind.LeftPar
        this.name = 'left-par'
        break
      case ')':
        this.kind = SymbolKind.RightPar
        this.name = 'right-par'
        break
      case '[':
        this.kind = SymbolKind.LeftBracket
        this.name = 'left-bracket'
        break
      case ']':
        this.kind = SymbolKind.RightBracket
        this.name = 'right-bracket'
        break
      case ',':
        this.kind = SymbolKind.Comma
        this.name = 'comma'
        break
      case '\n':
        this.kind = SymbolKind.EOL
        this.name = 'eol'
        break
    }
    // consumir el caracer actual
    source.nextChar()
  }
}

export class StringToken {
  kind: ValueKind.String
  column: number
  line: number
  error_found: boolean
  error_info: Errors.Lexical
  name = 'string'

  value: string
  text: string

  constructor(source : SourceWrapper) {
    this.kind = ValueKind.String
    this.value = ''
    this.line = source._current_line
    this.column = source._current_column
    this.extract(source)
  }

  extract(source : SourceWrapper) {
    // uso nextChar() en lugar de current xq no quiero que la " forme parte
    // de esta cadena
    this.value += source.nextChar()
    source.nextChar()

    let c : string
    while ( (c = source.currentChar()) !== '"' && c !== '\n' ) {
      this.value += c
      source.nextChar()
    }

    if (c === '"')
      this.text = '"' + this.value + '"'
    else {
      this.error_found = true
      this.error_info = {
        unexpected: '\n',
        expected: ['caracteres', '"'],
        pos: {line: source._current_line, column: source._current_column},
        reason: 'unexpectedCharAtString',
        where: 'lexer'
      }
    }

    // Consumo un caracter para dejar a currentChar() uno delante de la
    // " o del \n
    source.nextChar()
  }
}

function isReservedWord(word : string) {
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
        case 'ref':
        case 'neg':
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
        case 'retornar':
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

export class WordToken implements Token {
  kind: OtherKind.Word | ReservedKind
  column: number
  line: number
  error_found: boolean
  error_info: Errors.Lexical
  name: string

  text: string

  constructor(source : SourceWrapper) {
    this.kind = OtherKind.Word
    this.text = ''
    this.line = source._current_line
    this.column = source._current_column
    this.extract(source)
  }

  extract(source : SourceWrapper) {
    //agrega el primer caracter del token
    this.text += source.currentChar()
    source.nextChar()

    const isDigitOrLetter = (s: string) => {return isDigit(s) || isLetter(s) || s === '_'}

    let c : string
    while ( isDigitOrLetter(c = source.currentChar()) ) {
      this.text += c
      source.nextChar()
    }

    if (isReservedWord(this.text.toLowerCase()))      
      this.kind = wtk(this.text.toLowerCase())
      this.name = this.text.toLowerCase()
  }
}

export class UnknownToken {
  kind : OtherKind.Unknown
  column : number
  line : number
  error_found : boolean
  error_info : Errors.Lexical
  name = 'unknown'

  constructor(source : SourceWrapper) {
    this.kind = OtherKind.Unknown
    this.error_found = true
    this.error_info = {
      unexpected: source.currentChar(),
      expected: null,
      pos: {line: source._current_line, column: source._current_column},
      reason: 'unknownToken',
      where: 'lexer'
    }
    source.nextChar()
  }
}

/**
 * Convierte una palabra reservada en un ReservedKind  
 */
function wtk(word : string) : ReservedKind {
  switch (word.length) {
    case 2:
      switch (word) {
        case 'si':
          return ReservedKind.Si
        case 'or':
          return ReservedKind.Or
      }
    case 3:
      switch (word) {
        case 'fin':
          return ReservedKind.Fin
        case 'que':
          return ReservedKind.Que
        case 'div':
          return ReservedKind.Div
        case 'and':
          return ReservedKind.And
        case 'not':
          return ReservedKind.Not
        case 'mod':
          return ReservedKind.Mod
        case 'ref':
          return ReservedKind.Ref
        case 'neg':
          return ReservedKind.Neg
      }
    case 4:
      switch (word) {
        case 'sino':
          return ReservedKind.Sino
        case 'para':
          return ReservedKind.Para
        case 'real':
          return ReservedKind.Real
      }
    case 5:
      switch (word) {
        case 'finsi':
          return ReservedKind.FinSi
        case 'hasta':
          return ReservedKind.Hasta
        case 'falso':
          return ReservedKind.Falso
      }
    case 6:
      switch (word) {
        case 'inicio':
          return ReservedKind.Inicio
        case 'entero':
          return ReservedKind.Entero
        case 'logico':
          return ReservedKind.Logico
      }
    case 7:
      switch (word) {
        case 'finpara':
          return ReservedKind.FinPara
        case 'repetir':
          return ReservedKind.Repetir
        case 'funcion':
          return ReservedKind.Funcion
      }
    case 8:
      switch (word) {
        case 'entonces':
          return ReservedKind.Entonces
        case 'mientras':
          return ReservedKind.Mientras
        case 'caracter':
          return ReservedKind.Caracter
        case 'retornar':
          return ReservedKind.Retornar
      }
    case 9:
      switch (word) {
        case 'variables':
          return ReservedKind.Variables
        case 'verdadero':
          return ReservedKind.Verdadero
      }
    case 10:
      switch (word) {
        case 'finfuncion':
          return ReservedKind.FinFuncion
      }
    case 11:
      switch (word) {
        case 'finmientras':
          return ReservedKind.FinMientras
      }
    case 13:
      switch (word) {
        case 'procedimiento':
          return ReservedKind.Procedimiento
      }
    case 16:
      switch (word) {
        case 'finprocedimiento':
          return ReservedKind.FinProcedimiento
      }
  }  
}