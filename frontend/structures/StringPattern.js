'use strict'

class StringPattern {
  static capture(source) {
    let current = source.current()

    if (current.kind === 'string') {
      source.next()
      let error = false
      let result = current.value
      return {error, result}
    }
    else {
      return {
          error  : true
        , result : {
            expectedToken   : 'string'
          , unexpectedToken : current.kind
          , atColumn        : current.columnNumber
          , atLine          : current.lineNumber
        }
      }
    }
  }
}

module.exports = StringPattern
