'use strict'

class IntegerPattern {
  // source is an instance of TokenQueue
  static capture(source) {
    let current = source.current()

    if (current.kind === 'integer') {
      // consumir el token actual y...
      source.next()
      // ...devolver los datos importantes o...
      return {
          error  : false
        , result : current.value
      }
    }
    else {
      // ...devolver informacion sobre el error
      return {
          error   :  true
        , result  : {
            expectedToken   : 'integer'
          , unexpectedToken : current.kind
          , atColumn        : current.columnNumber
          , atLine          : current.lineNumber
        }
       }
    }
  }
}

module.exports = IntegerPattern
