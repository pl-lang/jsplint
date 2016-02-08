'use strict'

const Expression = require('../intermediate/structures/Expression')
const Emitter = require('../auxiliary/Emitter.js')

class Evaluator extends Emitter {
  constructor() {
    super(['read', 'write', 'evaluation-error'])
    this.running = true
  }

  set local_vars(variables) {
    this._local_vars = variables
  }

  set global_vars(variables) {
    this._global_vars = variables
  }

  writeCall(call) {
    let value_list = call.args.map((expression) => {
      return this.evaluateExp(expression, expression.expression_type)
    })

    this.emit({name:'write', origin:'evaluator'}, value_list)
  }

  readCall(call) {
    let varname_list = call.args.map((expression) => {return expression.varname})

    this.emit({name:'read', origin:'evaluator'}, varname_list)
  }

  assignReadData(varname, string) {
    let exp = Expression.fromString(string)

    if (exp.error) {
      // TODO
    }
    else {
      this.assignToVar(varname, exp.result)
    }
  }

  getValue(varname) {
    if (this._local_vars.hasOwnProperty(varname)) {
      if (this._local_vars[varname].hasOwnProperty('value')) {
        return this._local_vars[varname].value
      }
      else {
        this.running = false
        this.emit({name:'evaluation-error', origin:'evaluator'})
      }
    }
    else if (this._global_vars.hasOwnProperty(varname)) {
      if (this._global_vars[varname].hasOwnProperty('value')) {
        return this._global_vars[varname].value
      }
      else {
        this.running = false
        this.emit({name:'evaluation-error', origin:'evaluator'})
      }
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

      case 'equal':
        return operand_a === operand_b

      case 'diff-than':
        return operand_a != operand_b

      case 'minor-than':
        return operand_a < operand_b

      case 'major-than':
        return operand_a > operand_b

      case 'minor-equal':
        return operand_a <= operand_b

      case 'major-equal':
        return operand_a >= operand_b

      case 'and':
        return operand_a && operand_b

      case 'or':
        return operand_a || operand_b
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

  assignToVar(varname, expression) {
    let target

    if (varname in this._local_vars) {
      target = this._local_vars[varname]
    }
    else if (varname in this._global_vars) {
      target = this._global_vars[varname]
    }
    else {
      // TODO: la variable no existe (ni en locales ni en globales)
    }

    // TODO revisar que el tipo de la carga sea compatible con la var objetivo

    target.value = this.evaluateExp(expression)
  }

  runStatements(statements) {
    for (let statement of statements) {
      switch (statement.action) {
        case  'assignment':
        this.assignToVar(statement.target, statement.payload)
        break

        case  'module_call':
        if (statement.name == 'escribir') {
          this.writeCall(statement)
        }
        else if (statement.name == 'leer') {
          this.readCall(statement)
        }
        break

        case 'if':
        if (this.evaluateExp(statement.condition)) {
          this.runStatements(statement.true_branch);
        }
        else {
          for (let instruction of statement.false_branch) {
            this.runStatement(instruction)
          }
        }
        break

        case 'repeat': {
          let loop = statement

          for (let instruction of loop.body) {
            this.runStatement(instruction)
          }

          while (this.evaluateExp(loop.condition) == false) {
            for (let instruction of loop.body) {
              this.runStatement(instruction)
            }
          }
        }
        break

        case 'while': {
          let loop = statement

          while (this.evaluateExp(loop.condition)) {
            for (let instruction of loop.body) {
              this.runStatement(instruction)
            }
          }
        }
        break
      }
    }

    // TODO: hacer que esta funcion reporte error:true cuando ocurran errores de evaluacion
    return {error:false}
  }
}

module.exports = Evaluator
