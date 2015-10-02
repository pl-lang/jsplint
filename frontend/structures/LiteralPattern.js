'use strict'

class LiteralPattern {
  static capture(source) {
    let current = source.current()

    if (current.kind === 'integer' || current.kind === 'float') {
      source.next()
      return {
          result  : {type:current.kind, value:current.value}
        , error   : false
      }
    }
    else if (current.kind === 'string') {
      source.next()
      return {
          result  : {type:current.kind, value:current.value}
        , error   : false
      }
    }
    else {
      return {
          result  : {
              unexpected  : current.kind
            , expected    : ['integer', 'float', 'string']
            , atColumn    : current.columnNumber
            , atLine      : current.lineNumber
          }
        , error   : true
      }
    }
  }
}

module.exports = LiteralPattern
