'use strict'

let Expression = require('./Expression')

class AssignmentPattern {
  static capture(source) {
    let current = source.current()

    if (current.kind == 'word') {
      let target = current.text
      current = source.next()

      if (current.kind == 'assignment') {
        current = source.next()
        // Por ahora, las asignaciones solo funcionarian con enteros...
        let payload = Expression.fromQueue(source)
        if (payload.error) {
          return payload
        }
        else {
          return {
              result  : {
                  payload : payload.result
                , target  : target
                , action  : 'assignment'
              }
            , error   : false
          }
        }
      }
      else {
        return {
            result  : {
                unexpectedToken : current.kind
              , expectedToken   : 'assignment'
              , atColumn        : current.columnNumber
              , atLine          : current.lineNumber
            }
          , error   : true
        }
      }
    }
    else {
      return {
          result  : {
              unexpectedToken : current.kind
            , expectedToken   : 'word'
            , atColumn        : current.columnNumber
            , atLine          : current.lineNumber
          }
        , error   : true
      }
    }
  }
}

module.exports = AssignmentPattern
