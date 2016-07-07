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

  input(value) {
    this._state.stack.push(value)
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
      if ('paused' in output.value && output.value.paused === true) {
        return output.value
      }
      output = statement.next()
    }
    return output.value
  }

  *AssignmentIterator (assignment) {
    let variable = this.getVariable(assignment.target.name)

    let exp_evaluator = this.evaluateExpression(assignment.payload)
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
    // at this point 'payload' has been evaluated to a value
    if (variable.isArray) {
      yield* this.Assign(variable, payload, assignment.target.indexes, assignment.target.bounds_checked)
    }
    else {
      yield* this.Assign(variable, payload)
    }
    return {error:false, finished:true, result:null}
  }

  *Assign(variable, payload, indexes, bounds_checked) {
    if (variable.isArray) {
      let index_values = []

      for (let index of indexes) {
        let exp_evaluator = this.evaluateExpression(index)
        let evaluation_report = exp_evaluator.next()
        let actual_index = evaluation_report.value

        while (evaluation_report.done === false) {
          actual_index = evaluation_report.value

          if (typeof actual_index === 'object' && 'type' in actual_index) {
            // it turns out 'actual_index' is not a number but an that
            // represents a function call...
            yield actual_index

            actual_index = this._state.stack.pop()
          }

          evaluation_report = exp_evaluator.next()
        }

        index_values.push(actual_index - 1)
      }

      if (bounds_checked || this.indexWithinBounds(index_values, variable.dimension) ) {
        let index = this.calculateIndex(index_values, variable.dimension)
        variable.values[index] = payload
        return {error:false, finished:true, result:null}
      }
      else {
        let result = {
          reason: '@assignment-index-out-of-bounds',
          index: index_list,
          name: variable.name,
          dimension: variable.dimension
          // line
          // column
        }
        return {error:true, finished:true, result}
      }
    }
    else {
      variable.value = payload
      return {error:false, finished:true, result:null}
    }
  }

  *CallIterator (call_statement) {
    if (call_statement.name === 'leer') {
      let amount = call_statement.args.length
      let variables = call_statement.args.map(arg => arg[0].name).map(name => this.getVariable(name))
      let types = variables.map(variable => variable.type)

      yield {error:false, paused:true, finished:false, result:{action:'read', amount, types}}

      for (let i = 0; i < amount; i++) {
        let value = this._state.stack.pop()
        if (variables[i].isArray) {
          // TODO: revisar si arg.bounds_checked existe...
          yield* this.Assign(variables[i], value, call_statement.args[i][0].indexes, false)
        }
        else {
          yield* this.Assign(variables[i], value)
        }
      }

      return {error:false, finished:true, result:null}
    }
    else {
      let args = []

      for (let argument of call_statement.args) {
        let exp_evaluator = this.evaluateExpression(argument)
        let evaluation_report = exp_evaluator.next()
        let actual_argument = evaluation_report.value

        while (evaluation_report.done === false) {
          actual_argument = evaluation_report.value

          if (typeof actual_argument === 'object' && 'type' in actual_argument) {
            // it turns out 'actual_index' is not a number but an that
            // represents a function call...
            yield actual_argument

            actual_argument = this._state.stack.pop()
          }

          evaluation_report = exp_evaluator.next()
        }

        args.push(actual_argument)
      }

      if (call_statement.name === 'escribir') {
        return {error:false, finished:true, result:{action:'write', values:args}}
      }
    }
  }

  *IfIterator (if_statement) {
    let exp_evaluator = this.evaluateExpression(if_statement.condition)
    let evaluation_report = exp_evaluator.next()
    let condition_result = evaluation_report.value

    while (evaluation_report.done === false) {
      condition_result = evaluation_report.value

      if (typeof condition_result === 'object' && 'type' in condition_result) {
        // it turns out 'condition_result' is not a number but an that
        // represents a function call...
        yield condition_result

        condition_result = this._state.stack.pop()
      }

      evaluation_report = exp_evaluator.next()
    }

    this._current_node.setCurrentBranchTo(condition_result ? 'true_branch':'false_branch')

    return {error:false, finished:true, result:null}
  }

  *WhileIterator (while_statement) {
    let exp_evaluator = this.evaluateExpression(while_statement.condition)
    let evaluation_report = exp_evaluator.next()
    let condition_result = evaluation_report.value

    while (evaluation_report.done === false) {
      condition_result = evaluation_report.value

      if (typeof condition_result === 'object' && 'type' in condition_result) {
        // it turns out 'condition_result' is not a number but an that
        // represents a function call...
        yield condition_result

        condition_result = this._state.stack.pop()
      }

      evaluation_report = exp_evaluator.next()
    }

    this._current_node.setCurrentBranchTo(condition_result ? 'loop_body':'program_body')

    return {error:false, finished:true, result:null}
  }

  *UntilIterator (until_statement) {
    let exp_evaluator = this.evaluateExpression(until_statement.condition)
    let evaluation_report = exp_evaluator.next()
    let condition_result = evaluation_report.value

    while (evaluation_report.done === false) {
      condition_result = evaluation_report.value

      if (typeof condition_result === 'object' && 'type' in condition_result) {
        // it turns out 'condition_result' is not a number but an that
        // represents a function call...
        yield condition_result

        condition_result = this._state.stack.pop()
      }

      evaluation_report = exp_evaluator.next()
    }

    this._current_node.setCurrentBranchTo(!condition_result ? 'loop_body':'program_body')

    return {error:false, finished:true, result:null}
  }

  getVariable(varname) {
    return varname in this._locals ? this._locals[varname]:this._globals[varname]
  }

  *evaluateExpression (expression_stack) {
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
            case 'division':
              this.division()
              break
            case 'power':
              this.power()
              break
            case 'div':
              this.div()
              break
            case 'mod':
              this.mod()
              break
            case 'divide':
              this.divide()
              break
            case 'minus':
              this.minus()
              break
            case 'plus':
              this.plus()
              break
            case 'minor-than':
              this.less()
              break
            case 'minor-equal':
              this.less_o_equal()
              break
            case 'major-than':
              this.greater()
              break
            case 'major-equal':
              this.greate_or_equal()
              break
            case 'equal':
              this.equal()
              break
            case 'not':
              this.not()
              break
            case 'diff-than':
              this.different()
              break
            case 'and':
              this.and()
              break
            case 'or':
              this.or()
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
          console.log(token)
          throw new Error(`Tipo de expresion "${token.kind}" no reconocido.`)
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

  power () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(Math.pow(a, b))
  }

  div () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push((a - (a % b)) / b)
  }

  mod () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a % b)
  }

  divide () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a/b)
  }

  minus () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a - b)
  }

  plus () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a + b)
  }

  less () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a < b)
  }

  less_o_equal () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a <= b)
  }

  greater () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a > b)
  }

  greate_or_equal () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a >= b)
  }

  equal () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a == b)
  }

  not () {
    let a = this._state.stack.pop()

    this._state.stack.push(!a)
  }

  different () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a != b)
  }

  and () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a && b)
  }

  or () {
    let b = this._state.stack.pop()
    let a = this._state.stack.pop()

    this._state.stack.push(a || b)
  }

  *pushVariableValue (info) {
    let variable = this.getVariable(info.name)

    if (variable.isArray) {
      let index_values = []

      for (let index of info.indexes) {
        let exp_evaluator = this.evaluateExpression(index)
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
