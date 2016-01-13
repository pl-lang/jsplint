'use strict'

class WordPattern {
  static capture(source) {
    let current = source.current()

    if (current.kind === 'word') {
      source.next()

      return {
          error  : false
        , result : current.text
      }

    }
    else {
      return {
          error  : true
        , result : {
            expectedToken   : 'word'
          , unexpectedToken : current.kind
          , atColumn        : current.columnNumber
          , atLine          : current.lineNumber
        }
      }
    }
  }
}

module.exports = WordPattern
