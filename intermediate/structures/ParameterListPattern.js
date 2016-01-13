'use strict'

let ParameterPattern = require('./ParameterPattern.js')

class ParameterListPattern {
  static capture(source) {
    let parameters = []
    let p = ParameterPattern.capture(source)

    if (p.error) {
      return p
    }
    else {
      parameters.push(p.result)
      let c = source.current()
      if (c.kind === 'comma') {
        source.next()
        let otherParameters = this.capture(source)
        if (otherParameters.error) {
          return otherParameters
        }
        else {
          return {
              result  : parameters.concat(otherParameters.result)
            , error   : false
          }
        }
      }
      else {
        return {
            result  : parameters
          , error   : false
        }
      }
    }
  }
}

module.exports = ParameterListPattern
