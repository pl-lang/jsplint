'use strict'

class BeginPattern {
  static capture(source) {
    let current = source.current()
    if (current.kind === 'inicio') {
      source.next()
      return {
          result  : {
              atColumn  : current.columnNumber
            , atLine    : current.lineNumber
            , text      : current.kind
          }
        , error   : false
      }
    }
    else
      return {
          result  : {
              unexpectedToken : current.kind
            , expectedToken   : 'inicio'
            , atColumn        : current.columnNumber
            , atLine          : current.lineNumber
          }
        , error   : true
      }
  }
}

module.exports = BeginPattern
