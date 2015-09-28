'use strict'
let WordPattern = require('./WordPattern.js')
let IndexesPattern = require('./IndexesPattern.js')

class VariableNamePattern {
  static capture(source) {
    let name = {
        isArray : false
      , text    : ''
    }

    let text = WordPattern.capture(source)

    if (text.error)
      return text
    else {
      name.text = text.result

      if (source.current().kind === 'left-bracket') {
        source.next()
        let dimension = IndexesPattern.capture(source)
        if (dimension.error)
          return dimension
        else {
          name.isArray = true
          name.dimension = dimension.result
          if (source.current().kind === 'right-bracket') {
            source.next()
            return {
                result : name
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
            result : name
          , error  : false
        }

    }

  }
}

module.exports = VariableNamePattern
