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
      return this.evaluateExp(thing, thing.expression_type)
    })
    this.sendMessage({subject:'escribir', things_to_print:things_to_print})
  }

  callLeer(call) {

  }

  getValue(varname) {
    // Manejar el caso donde la variable no tiene ningun valor. Por ahora devuelve null
    if (this.localVariables.hasOwnProperty(varname)) {
      return this.localVariables[varname].value
    }
    else if (this.globalVariables.hasOwnProperty(varname)) {
      return this.globalVariables[varname].value
    }
  }

  evaluateOperation(exp) {
    let operand_a = this.evaluateExp(exp.operands[0])
    let operand_b = this.evaluateExp(exp.operands[1])
    switch (exp.op) {
      case  'plus':
      return operand_a + operand_b

      case  'minus':
      return operand_a - operand_b

      case  'times':
      return operand_a * operand_b

      case  'divide':
      return operand_a / operand_b

      case  'div':
      return (operand_a - (operand_a % operand_b)) / operand_b

      case  'mod':
      return operand_a % operand_b

      case  'power':
      return Math.pow(operand_a, operand_b)
    }
  }

  evaluateUnaryOperation(exp) {
    let operand = this.evaluateExp(exp.operand)

    switch (exp.op) {
      case 'unary-minus':
      return (-1)*operand

      case 'not':
      return !operand
    }
  }

  evaluateExp(exp) {
    switch (exp.expression_type) {
      case 'invocation':
        return this.getValue(exp.varname)
      case  'literal':
        return exp.value
      case  'operation':
        return this.evaluateOperation(exp)
      case  'unary-operation':
        return this.evaluateUnaryOperation(exp)
      case  'expression':
        return this.evaluateExp(exp.expression)
    }
  }

  start() {
    this.run(this.statements)
  }

  run(statements) {
    for (let statement of statements) {
      switch (statement.action) {
        case  'assignment':
        // Habria que buscar la variable objetivo (primero entre las locales, luego entre las globales)
        this.localVariables[statement.target].value = this.evaluateExp(statement.payload)
        break

        case  'module_call':
        if (statement.name == 'escribir') {
          this.callEscribir(statement)
        }
        else if (statement.name == 'leer') {
          this.callLeer(statement)
        }
        break

        case 'if':
        if (this.evaluateExp(statement.condition)) {
          this.run(statement.true_branch)
        }
        else {
          this.run(statement.false_branch)
        }
        break

        case 'repeat': {
          let loop = statement
          this.run(loop.body)

          while (this.evaluateExp(loop.condition) == false) {
            this.run(loop.body)
          }
        }
        break
        
      }
    }
  }
}

module.exports = Evaluator
