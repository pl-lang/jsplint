'use strict'

class Evaluator {
  constructor(statements, localVariables, globalVariables) {
    this.globalVariables = globalVariables
    this.localVariables = localVariables
    this.statements = statements
  }

  arithmeticOp(operation) {
    let operands = operation.operands
    let operand_a = operands[0].expression_type == 'literal' ? this.evaluateFactor(operands[0], 'literal') : this.evaluateFactor(operands[0].content, 'operation')
    let operand_b = operands[1].expression_type == 'literal' ? this.evaluateFactor(operands[1], 'literal') : this.evaluateFactor(operands[1].content, 'operation')

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
    else if (type == 'term_list') {
      return this.evaluateTerms(factor)
    }
  }

  evaluateTerms(list_of_terms) {
    let result = 0
    for (let term of list_of_terms) {
      let proximo_termino = 0
      if (term.expression_type == 'literal' || term.expression_type == 'operation') {
        proximo_termino = (term.sign == 'plus') ? this.evaluateFactor(term.content, term.expression_type):this.evaluateFactor(term.content, term.expression_type)*(-1)
      }
      else if (term.expression_type == 'term-list') {
        proximo_termino = (term.sign == 'plus') ? this.evaluateTerms(term.content.terms):this.evaluateTerms(term.content.terms)*(-1)
      }
      result += proximo_termino
    }
    return result
  }

  run() {
    for (let statement of this.statements) {
      switch (statement.action) {
        case 'assignment':
        // Habria que buscar la variable objetivo (primero entre las locales, luego entre las globales)
        this.localVariables[statement.target].value = this.evaluateTerms(statement.payload.terms)
        break
      }
    }
  }
}

module.exports = Evaluator
