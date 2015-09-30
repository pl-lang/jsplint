'use strict'

let operators = [
    'and'
  , 'or'
  , 'mod'
  , 'div'
  , 'times'
  , 'divide'
  , 'power'
]

let opSet = new Set(operators)

class BinaryOpPattern {
  static capture(source) {
    let current = source.current()
    let op
    let error = false

    if (opSet.has(current.kind)) {
      source.next()
      return {
          result  : current.kind
        , error   : false
      }
    }
    else {
      return {
          result  : {
              unexpectedToken : current.kind
            , expectedTokens  : ['and', 'or', 'mod', 'div', 'times', 'divide', 'power']
            , atColumn        : current.columnNumber
            , atLine          : current.lineNumber
          }
        , error   : true
      }
    }
  }
}

module.exports = BinaryOpPattern
