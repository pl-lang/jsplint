'use strict'
let WordPattern = require('./WordPattern.js')
let IntegerIndexesPattern = require('./IntegerIndexesPattern.js')

class VariableNamePattern {
  static capture(source) {
    let variable = {
        data    : {isArray : false, type:'unknown'}
      , name    : ''
    }

    let text = WordPattern.capture(source)

    if (text.error)
      return text
    else {
      variable.name = text.result

      if (source.current().kind === 'left-bracket') {
        source.next()
        let dimension = IntegerIndexesPattern.capture(source)
        if (dimension.error)
          return dimension
        else {
          variable.data.isArray = true
          variable.data.dimension = dimension.result
          if (source.current().kind === 'right-bracket') {
            source.next()
            return {
                result : variable
              , error  : false
            }
          }
          else
            return {
                result : {
                    unexpectedToken : source.current().kind
                  , expectedToken   : 'right-bracket'
                  , atColumn        : source.current().columnNumber
                  , atLine          : source.current().lineNumber
                }
              , error  : true
            }
        }
      }
      else
        return {
            result : variable
          , error  : false
        }

    }

  }
}

module.exports = VariableNamePattern
