'use strict'
const StringMethods = require('../../misc/StringMethods.js')

let list = [
  'variables'         ,
  'inicio'            ,
  'fin'               ,
  'si'                ,
  'entonces'          ,
  'sino'              ,
  'finsi'             ,
  'para'              ,
  'hasta'             ,
  'finpara'           ,
  'mientras'          ,
  'finmientras'       ,
  'repetir'           ,
  'hasta'             ,
  'que'               ,
  'funcion'           ,
  'finfuncion'        ,
  'procedimiento'     ,
  'finprocedimiento'  ,
  'entero'            ,
  'real'              ,
  'logico'            ,
  'caracter'          ,
  'div'               ,
  'and'               ,
  'or'                ,
  'not'               ,
  'mod'               ,
  'verdadero'         ,
  'falso'
]

let isDigit = StringMethods.isDigit

let isLetter = StringMethods.isLetter

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

class WordToken {
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

module.exports = WordToken
