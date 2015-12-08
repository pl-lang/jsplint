'use strict'

const StringPattern = require('./StringPattern')

class StringExpression {
  static capture(source) {
    let word = StringPattern.capture(source)

    if (word.error) {
      return word
    }
    else {
      let expression_type     = 'string'
      let length              = word.result.length
      let value               = word.result
      return {error:false, result:{expression_type, value, length}}
    }
  }
}

module.exports = StringExpression