'use strict'

class NumberPattern {
  static capture(source) {
    let current = source.current()

    if (current.kind == 'real' || current.kind == 'entero') {
      source.next()
      return {result:{value:current.value, type:current.kind}, error:false}
    }
    else {
      return {
          result  : {
              unexpected  : current.kind
            , expected    : ['entero', 'real']
            , atColumn    : current.columnNumber
            , atLine      : current.lineNumber
          }
        , error   : true
      }
    }
  }
}

module.exports = NumberPattern
