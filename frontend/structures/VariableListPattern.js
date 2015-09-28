'use strict'
let VariableNamePattern = require('./VariableNamePattern.js')

class VariableListPattern {
  static capture(source) {
    let names = []

    let capture = VariableNamePattern.capture(source)

    if (capture.error)
      return capture
    else {
      names.push(capture.result)
      if (source.current().kind === 'comma') {
        source.next()
        let nameList = this.capture(source)

        if (nameList.error)
          return nameList
        else
          return {
              result  : names.concat(nameList.result)
            , error   : false
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
