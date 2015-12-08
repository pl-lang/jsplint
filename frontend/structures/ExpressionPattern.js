'use strict'

const StringExpressionPattern = require('./StringExpressionPattern')
const MathExpressionPattern   = require('./MathExpressionPattern')

class Expression {
  static capture(source) {
    if (source.current().kind == 'string') {
      return StringExpressionPattern.capture(source)
    }
    else {
      return MathExpressionPattern.capture(source)
    }
  }
}

module.exports = Expression
