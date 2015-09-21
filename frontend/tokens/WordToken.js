'use strict'
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
  'hastaque'          ,
  'funcion'           ,
  'finfuncion'        ,
  'procedimiento'     ,
  'finprocedimiento'  ,
  'entero'            ,
  'real'              ,
  'logico'            ,
  'caracter'
]

var reserved = new Set(lista)

function isDigit(string) {
  return /\d/.test(string)
}

function isLetter(string) {
  return /[a-zA-Z]/.test(string)
}

class WordToken {
  constructor(source) {
    this.kind = 'word'
    this.text = ''
    //sumo 1 xq en la interfaz la primer columna del primer renglon
    // es 1:1 (en lugar de 0:0)
    this.lineNumber = source._currentLineIndex + 1
    this.startIndex = source._currentCharIndex + 1
    this.extract(source)
  }

  extract(source) {
    //agrega el primer caracter del token
    this.text += source.currentChar()
    source.nextChar()

    let isDigitOrLetter = (s) => {return isDigit(s) || isLetter(s)}

    let c
    while ( isDigitOrLetter(c = source.currentChar()) ) {
      this.text += c
      source.nextChar()
    }

    if (reserved.has(this.text.toLowerCase()))
      this.kind = this.text.toLowerCase()
  }
}
