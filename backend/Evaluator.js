'use strict'

class Evaluator {
  constructor(statements, localVariables, globalVariables) {
    this.globalVariables = globalVariables
    this.localVariables = localVariables
    this.statements = statements
  }

  arithmeticOp(operation) {
    let operand_a = this.evaluateFactor(operation.operands[0], operation.operands[0].expression_type)
    let operand_b = this.evaluateFactor(operation.operands[1], operation.operands[1].expression_type)

    switch (operation.op) {
      case  'times':
        return operand_a*operand_b
      case  'divide':
        return operand_a/operand_b
      case  'power':
        return Math.pow(operand_a, operand_b)
      case  'mod':
        return operand_a % operand_b
      case  'div':
        return  (operand_a - (operand_a % operand_b)) / operand_b
    }
  }
  evaluateFactor(factor, type) {
    if (type == 'literal') {
      return (factor.sign == 'plus') ? factor.value : factor.value*(-1)
    }
    else if (type == 'operation') {
      return this.arithmeticOp(factor)
    }
  }

  evaluateTerms(terms) {
    let result = 0
    for (let term of terms) {
      let proximo_termino = (term.sign == 'plus') ? this.evaluateFactor(term.content, term.expression_type):this.evaluateFactor(term.content, term.expression_type)*(-1)
      result += proximo_termino
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
