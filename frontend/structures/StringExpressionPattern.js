'use strict'

const WordPattern = require('./WordPattern')

class StringExpression {
  static capture(source) {
    let word = WordPattern.capture(source)

    if (word.error) {
      return word
    }
    else {
      expression_type     = 'string'
      length              = word.result.length
      value               = word.result
      return {error:false, result:{expression_type, value, length}}
    }
  }
}

module.exports = StringExpression
