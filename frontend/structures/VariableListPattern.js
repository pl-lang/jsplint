'use strict'
let VariableNamePattern = require('./VariableNamePattern.js')

class VariableListPattern {
  static capture(source) {
    let names = []
    let partialMatch = false

    let capture = VariableNamePattern.capture(source)

    if (capture.error)
      return capture
    else {
      names.push(capture.result)
      partialMatch = true
      if (source.current().kind === 'comma') {
        source.next()
        let nameList = this.capture(source)

        if (nameList.error)
            if (partialMatch === false)
              return nameList
            else
              return {
                  result  : names
                , error   : false
              }
        else {
          return {
              result  : names.concat(nameList.result)
            , error   : false
          }
        }
      }
      else
        return {
            result  : names
          , error   : false
        }
    }
  }
}

module.exports = VariableListPattern
