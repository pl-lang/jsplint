'use strict'

/*
  Un evaluador sirve para ejecutar las acciones/enunciados de un modulo.
  Se crea con la info necesaria para dicha tarea. El retorno de su modulo se
  devuelve a traves de la funcion run.
*/

/*
  Los evaluadores son eleiminados cuando terminan de ejecutar su modulo. Son de
  un solo uso.
*/

/**
 * Eventos que emite:
 * 	- read
 * 	- write
 * 	- evaluation-error
 * 	- module-call
 */

export default class TestableEvaluator {
  constructor(root_statement, locals, globals) {
    this._current_node = root_statement
    this._current_statement = null
    this._locals = locals
    this._globals = globals
    this._state = {
      done: root_statement === null ? true:false,
      error: false,
      output: null,
      variables_awaiting_data: [],
      stack: [],
    }
  }

  step() {
    if (this._state.done || this._state.error || this._state.variables_awaiting_data.length > 0) {
      return {done:this._state.done, error:this._state.error, output:this._state.output}
    }
    else {
      if (this._current_statement === null) {
        this._current_statement = this.getStatementIterator(this._current_node.data)
      }

      let output = this.runStatement(this._current_statement)

      this._state.error = output.error
      this._state.output = output.result

      if (output.finished) {
        this._current_node = this._current_node.getNext()
        this._current_statement = null
      }

      if (this._current_node === null) {
        this._state.done = true
      }

      return {done:this._state.done, error:this._state.error, output:output.result}
    }
  }

  getStatementIterator (statement) {
    switch (statement.action) {
      case 'assignment':
        return this.AssignmentIterator(statement)
      case 'module_call':
        return this.CallIterator(statement)
      case 'if':
        return this.IfIterator(statement)
      case 'while':
        return this.WhileIterator(statement)
      case 'until':
        return this.UntilIterator(statement)
      default:
        throw new Error(`En TestableEvaluator::getStatementIterator --> no se reconoce el enunciado ${statement.action}`)
    }
  }

  runStatement (statement) {
    let output = statement.next()
    while (output.value.finished === false && output.value.error === false) {
      output = statement.next()
    }
    return output.value
  }

  *AssignmentIterator (assignment) {
    let variable = this.getVariable(assignment.target.name)

    if (variable.isArray) {
      let index_values = []

      for (let index of assignment.target.indexes) {
        let exp_evaluator = this.evaluateExpression2(index)
        let evaluation_report = exp_evaluator.next()
        let actual_index = evaluation_report.value

        while (evaluation_report.done === false) {
          actual_index = evaluation_report.value

          if (typeof actual_index === 'object' && 'type' in actual_index) {
            // it turns out 'actual_index' is not a number but an that
            // represents a function call...
            yield actual_index

            payload = this._state.stack.pop()
          }

          evaluation_report = exp_evaluator.next()
        }

        index_values.push(actual_index - 1)
      }

      if (assignment.target.bounds_checked || this.indexWithinBounds(index_values, variable.dimension) ) {
        let index = this.calculateIndex(index_values, variable.dimension)

        let exp_evaluator = this.evaluateExpression2(assignment.payload)
        let evaluation_report = exp_evaluator.next()
        let payload = evaluation_report.value

        while (evaluation_report.done === false) {
          payload = evaluation_report.value
          if (typeof payload === 'object' && 'type' in payload) {
            // the payload is actually a function calll
            yield payload

            // if execution reaches this point then the function was evaluated
            // succesfully and its return value is at the top of the stack
            payload = this._state.stack.pop()
          }
          evaluation_report = exp_evaluator.next()
        }

        variable.values[index] = payload

        yield {error:false, finished:true, result:null}
      }
      else {
        let result = {
          reason: '@assignment-index-out-of-bounds',
          index: index_list,
          name: assignment.target.name,
          dimension: variable.dimension
          // line
          // column
        }
        yield {error:true, finished:true, result}
      }
    }
    else {
      let exp_evaluator = this.evaluateExpression2(assignment.payload)
      let evaluation_report = exp_evaluator.next()
      let payload = evaluation_report.value

      while (evaluation_report.done === false) {
        payload = evaluation_report.value
        if (typeof payload === 'object' && 'type' in payload) {
          // the payload is actually a function calll
          yield payload

          // if execution reaches this point then the function was evaluated
          // succesfully and its return value is at the top of the stack
          payload = this._state.stack.pop()
        }
        evaluation_report = exp_evaluator.next()
      }
      variable.value = payload

      yield {error:false, finished:true, result:null}
    }
  }

  *CallIterator (call_statement) {
    let argument_amount = call_statement.args.length
    let args = new Array(argument_amount)

    for (let arg of call_statement.args) this.evaluateExpression(arg)

    for (let i = argument_amount - 1; i >= 0; i--) {
      let evaluation_report = this._state.stack.pop()
      if (evaluation_report.error) {
        yield {error:true, finished: true, result:evaluation_report.result}
      }
      else if (evaluation_report.result.type === 'call') {
        yield {error:false, finished: false, result:evaluation_report.result}

        let evaluation_report = this._state.stack.pop()

        if (evaluation_report.error) {
          yield {error:true, finished:true, result:evaluation_report.result}
        }
        else {
          args[i] = evaluation_report.result.value
        }
      }
      else {
        args[i] = evaluation_report.result.value
      }
    }

    if (call_statement.name === 'escribir') {
      yield {error:false, finished:true, result:{action:'write', values:args}}
    }
  }

  getVariable(varname) {
    return varname in this._locals ? this._locals[varname]:this._globals[varname]
  }

  // evaluateExpression (expression) {
  //   switch (expression.expression_type) {
  //     case 'invocation':
  //       this._state.stack.push(this.getVariableValue(expression))
  //       break
  //     case 'literal':
  //       this._state.stack.push({error:false, result:{type:'literal', value:expression.value}})
  //       break
  //     case  'operation':
  //       // return this.evaluateOperation(exp)
  //     case  'unary-operation':
  //       // return this.evaluateUnaryOperation(exp)
  //     case  'expression':
  //       // return this.evaluateExpression(exp.expression)
  //     default:
  //       break
  //   }
  // }
  *evaluateExpression2 (expression_stack) {
    for (let token of expression_stack) {
      switch (token.kind) {
        case 'operator':
          switch (token.operator) {
            case 'times':
              this.times()
              break
            case 'unary-minus':
              this.uminus()
              break
            default:
              throw new Error(`Operador "${token.operator}" no reconocido`)
          }
          break
        case 'literal':
          this._state.stack.push(token.value)
          break
        case 'invocation':
          yield* this.pushVariableValue(token)
          break
        default:
          throw new Error(`Tipo de expresion "${token.kind}" no reconocido`)
      }
    }
    yield this._state.stack.pop()
  }

  times() {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a*b)
  }

  uminus() {
    let a = this._state.stack.pop()

    this._state.stack.push(-a)
  }

  evaluateExpression (expression_stack) {
    for (let token of expression_stack) {
      switch (token.kind) {
        case 'operator':
          switch (token.operator) {
            case 'times':
              {
                let b = this._state.stack.pop().result.value
                let a = this._state.stack.pop().result.value
                this._state.stack.push({error:false, result:{type:'literal', value:a*b}})
              }
              break
            case 'unary-minus':
              {
                let a = this._state.stack.pop().result.value
                this._state.stack.push({error:false, result:{type:'literal', value:-a}})
              }
              break
            default:
              throw new Error(`Operador "${token.operator}" no reconocido`)
          }
          break
        case 'literal':
          this._state.stack.push({error:false, result:{type:'literal', value:token.value}})
          break
        case 'invocation':
          this._state.stack.push(this.getVariableValue(token))
          break
        default:
          throw new Error(`Tipo de expresion "${token.kind}" no reconocido`)
      }
    }
  }

  *pushVariableValue (info) {
    let variable = this.getVariable(info.name)

    if (variable.isArray) {
      let index_values = []

      for (let index of info.indexes) {
        let exp_evaluator = this.evaluateExpression2(index)
        let evaluation_report = exp_evaluator.next()
        let actual_index = evaluation_report.value

        while (evaluation_report.done === false) {
          actual_index = evaluation_report.value

          if (typeof actual_index === 'object' && 'type' in actual_index) {
            // it turns out 'actual_index' is not a number but an that
            // represents a function call...
            yield actual_index

            payload = this._state.stack.pop()
          }

          evaluation_report = exp_evaluator.next()
        }

        index_values.push(actual_index - 1)
      }

      if (info.bounds_checked || this.indexWithinBounds(index_values, variable.dimension)) {
        let index = this.calculateIndex(index_values, variable.dimension)
        return this._state.stack.push(variable.values[index])
      }
      else {
        let out_of_bunds_info = this.getBoundsError(index_values, variable.dimension)
        return {error:true, result:out_of_bunds_info}
      }
    }
    else {
      this._state.stack.push(variable.value)
    }
  }

  indexWithinBounds (index_values, dimension_lengths) {
    let i = 0

    // NOTE: en las condiciones de abajo sumo 1 porque en index_values se le
    // restó 1 a cada elemento para que sea un indice válido en JS

    while (i < index_values.length) {
      if ((index_values[i] + 1) < 1) {
        return false
      }
      else if ((index_values[i] + 1) > dimension_lengths[i]) {
        return false
      }
      else {
        i++
      }
    }
    return true
  }

  getBoundsError (index_values, dimension_lengths) {
    let i = 0
    while (i < index_values.length) {
      if ((index_values[i] + 1) < 1) {
        this.running = false
        let reason = 'index-less-than-one'
        let bad_index = i
        return {error:true, result:{reason, bad_index}}
      }
      else if ((index_values[i] + 1) > dimension_lengths[i]) {
        out_of_bounds_index = true
        let reason = 'index-out-of-bounds'
        let bad_index = i
        let expected = variable.dimension[i]
        return {error:true, result:{reason, bad_index, expected}}
      }
      else {
        i++
      }
    }
  }

  calculateIndex(index_array, dimensions) {
    let result = 0
    let index_amount = index_array.length
    let i = 0

    while (i < index_amount) {
      let term = 1
      let j = i + 1
      while (j < index_amount) {
        term *= dimensions[j]
        j++
      }
      term *= index_array[i]
      result += term
      i++
    }
    return result
  }
}
