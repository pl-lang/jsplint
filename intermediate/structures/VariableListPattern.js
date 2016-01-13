'use strict'
let VariableNamePattern = require('./VariableNamePattern.js')

class VariableListPattern {
  static capture(source) {
    let variables = []
    let partialMatch = false

    let capture = VariableNamePattern.capture(source)

    if (capture.error)
      return capture
    else {
      variables.push(capture.result)
      partialMatch = true
      if (source.current().kind === 'comma') {
        source.next()
        let varList = this.capture(source)

        if (varList.error)
            if (partialMatch === false)
              return varList
            else
              return {
                  result  : variables
                , error   : false
              }
        else {
          return {
              result  : variables.concat(varList.result)
            , error   : false
          }
        }
      }
      else
        return {
            result  : variables
          , error   : false
        }
    }
  }
}

module.exports = VariableListPattern
