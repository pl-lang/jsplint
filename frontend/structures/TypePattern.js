'use strict'
// String -> Bool
let isType = string => {return /entero|real|logico|caracter/.test(string)}

class TypePattern {
  static capture(source) {
    let current = source.current()

    if ( isType(current.kind) ) {
      source.next()
      return {
          result  : current.kind
        , error   : false
      }
    }
    else
      return {
          result  : {
              unexpectedToken : current.kind
            , expectedTokens  : ['entero', 'real', 'logico', 'caracter']
            , atColumn        : current.columnNumber
            , atLine          : current.lineNumber
          }
        , error   : true
      }
  }
}

module.exports = TypePattern
