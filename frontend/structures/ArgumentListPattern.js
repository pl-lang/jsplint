'use strict'

let ExpressionPattern = require('./ExpressionPattern')

class ArgumentListPattern {
  static capture(source) {
    let args = []
    let exp = ExpressionPattern.capture(source)

    if (exp.error) {
      return exp
    }
    else {
      args.push(exp.result)

      if (source.current().kind == 'comma') {
        source.next()
        let next_args = ArgumentListPattern.capture(source)
        if (next_args.error) {
          return next_args
        }
        else {
          args = args.concat(next_args.result)
          return {error:false, result:args}
        }
      }
      else {
        return {error:false, result:args}
      }
    }
  }
}

module.exports = ArgumentListPattern
