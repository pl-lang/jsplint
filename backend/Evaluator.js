'use strict'

let MessageHandler = require('../messages/MessageHandler.js')

class Evaluator {
  constructor(statements, localVariables, globalVariables) {
    this.globalVariables = globalVariables
    this.localVariables = localVariables
    this.statements = statements
    this.message_handler = new MessageHandler()
  }

  sendMessage(message) {
    this.message_handler.sendMessage(message)
  }

  addMessageListener(listener) {
    this.message_handler.addMessageListener(listener)
  }

  removeMessageListener(listener) {
    this.message_handler.removeMessageListener(listener)
  }

  callEscribir(call) {
    let things_to_print = call.args.map((thing) => {
      return this.evaluateFactor(thing, thing.expression_type)
    })
    this.sendMessage({subject:'escribir', things_to_print:things_to_print})
  }

  callLeer(call) {

  }

  arithmeticOp(operation) {
    let operands = operation.operands
    let operand_a = operands[0].expression_type == 'literal' ? this.evaluateFactor(operands[0], 'literal') : this.evaluateFactor(operands[0], 'operation')
    let operand_b = operands[1].expression_type == 'literal' ? this.evaluateFactor(operands[1], 'literal') : this.evaluateFactor(operands[1], 'operation')
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
    else if (type == 'term-list') {
      return this.evaluateTerms(factor.terms)
    }
  }

  evaluateTerms(list_of_terms) {
    let result = 0
    for (let term of list_of_terms) {
      let proximo_termino = 0
      if (term.expression_type == 'literal' || term.expression_type == 'operation') {
        proximo_termino = this.evaluateFactor(term, term.expression_type)
      }
      else if (term.expression_type == 'term-list') {
        proximo_termino = (term.sign == 'plus') ? this.evaluateTerms(term.terms):this.evaluateTerms(term.terms)*(-1)
      }
      result += proximo_termino
    }
    return result
  }

  run() {
    for (let statement of this.statements) {
      switch (statement.action) {
        case  'assignment':
        // Habria que buscar la variable objetivo (primero entre las locales, luego entre las globales)
        this.localVariables[statement.target].value = this.evaluateTerms(statement.payload.terms)
        break

        case  'module_call':
        if (statement.name == 'escribir') {
          this.callEscribir(statement)
        }
        else if (statement.name == 'leer') {
          this.callLeer(statement)
        }
        break
      }
    }
  }
}

module.exports = Evaluator
