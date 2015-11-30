'use strict'

class Evaluator {
  constructor(statements, localVariables, globalVariables) {
    this.globalVariables = globalVariables
    this.localVariables = localVariables
    this.statements = statements
  }

  evaluateFactor(factor) {
    return (factor.sign == 'plus') ? factor.value : factor.value*(-1)
  }

  evaluateTerms(terms) {
    let result = 0
    for (let term of terms) {
      if (term.expression_type == 'literal') {
        result = result + (term.sign == 'plus') ? this.evaluateFactor(term.content):this.evaluateFactor(term.content)*(-1)
      }
    }
    return result
  }

  run() {
    for (let statement of this.statements) {
      switch (statement.action) {
        case 'assignment':
        // Habria que buscar la variable objetivo (primero entre las locales, luego entre las globales)
        this.localVariables[statement.target].value = this.evaluateTerms(statement.payload)
        break
      }
    }
  }
}

module.exports = Evaluator
