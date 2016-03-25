'use strict'
let StringMethods = require('../../misc/StringMethods.js')

var list = [
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

var reserved = new Set(list)

let isDigit = StringMethods.isDigit

let isLetter = StringMethods.isLetter

class WordToken {
  constructor(source) {
    this.kind = 'word'
    this.text = ''
    this.lineNumber = source._currentLineIndex
    this.columnNumber = source._currentCharIndex
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

    if (reserved.has(this.text.toLowerCase()))
      this.kind = this.text.toLowerCase()
  }
}

module.exports = WordToken
