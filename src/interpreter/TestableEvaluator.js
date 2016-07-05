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

      this._state.error = output.value.error
      this._state.output = output.value.result

      if (output.value.finished) {
        this._current_node = this._current_node.getNext()
        this._current_statement = null
      }

      if (this._current_node === null) {
        this._state.done = true
      }

      return {done:this._state.done, error:this._state.error, output:output.value.result}
    }
  }

  *getStatementIterator (statement) {
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

  *AssignmentIterator (assignment) {
    let variable = this.getVariable(assignment.target.name)

    if (variable.isArray) {
      let index_amount = assignment.target.indexes.length

      for (let index of assignment.target.indexes) this.evaluateExpression(index)

      let index_list = new Array(index_amount)

      // calcular indices
      for (let i = 0; i < index_amount; i++) {
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
            index_list[i] = evaluation_report.result
          }
        }
        else {
          index_list[i] = evaluation_report.result
        }
      }

      if (assignment.target.bounds_checked || this.indexWithinBounds(index_list, variable.dimension) ) {
        let index = this.calculateIndex(index_list, variable.dimension)
        this.evaluateExpression(assignment.payload)
        let evaluation_report = this._state.stack.pop()
        if (evaluation_report.error) {
          yield {error:true, finished:true, result:evaluation_report.result}
        }
        else {
          variable.values[index] = evaluation_report.result
        }
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
      this.evaluateExpression(assignment.payload)
      let evaluation_report = this._state.stack.pop()
      if (evaluation_report.error) {
        yield {error:true, finished:true, result:evaluation_report.result}
      }
      else if (evaluation_report.result.type === 'call') {
        yield {error:false, finished: false, result:evaluation_report.result}

        let evaluation_report = this._state.stack.pop()

        if (evaluation_report.error) {
          yield {error:true, finished:true, result:evaluation_report.result}
        }
        else {
          variable.value = evaluation_report.result
          yield {error:false, finished:true, result:null}
        }
      }
      else {
        variable.value = evaluation_report.result
        yield {error:false, finished:true, result:null}
      }
    }
  }

  runAssignment (assignment) {
    let variable = this.getVariable(assignment.target.name)

    if (variable.isArray) {

      for (let index of assignment.target.indexes) this.evaluateExpression(index)

      let index_list = new Array(assignment.target.indexes.length)

      for (let i = 0; i < index_list.length; i++) {
        let evaluation_report = this._state.stack.pop()
        if (evaluation_report.error) {
          return {error:true, finished:true, result:evaluation_report.result}
        }
        else {
          let index = evaluation_report.result - 1
          index_list[i] = index
        }
      }

      if (assignment.target.bounds_checked || this.indexWithinBounds(index_list, variable.dimension) ) {
        let index = this.calculateIndex(index_list, variable.dimension)
        this.evaluateExpression(assignment.payload)
        let evaluation_report = this._state.stack.pop()
        if (evaluation_report.error) {
          return {error:true, finished:true, result:evaluation_report.result}
        }
        else {
          variable.values[index] = evaluation_report.result
        }
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
        return {error:true, finished:true, result}
      }
    }
    else {
      this.evaluateExpression(assignment.payload)
      let evaluation_report = this._state.stack.pop()
      if (evaluation_report.error) {
        return {error:true, finished:true, result:evaluation_report.result}
      }
      else {
        variable.value = evaluation_report.result
      }
    }

    return {error:false, finished:true, result:null}
  }

  runWhile (while_statement) {
    return {error:false, result:null}
  }

  runUntil (until_statement) {
    return {error:false, result:null}
  }

  runCall (call_statement) {
    if (call_statement.name === 'escribir') {
      // TODO: esto podria devolver un error cuando se implementen las funciones
      let evaluated_arguments = call_statement.args.map(this.evaluateExpression)

      for (let report of evaluated_arguments) {
        if (report.error) {
          return {error:true, result:report.result}
        }
      }

      let values = evaluated_arguments.map(report => report.result)

      return {error:false, result:{action:'write', values}}
    }

    return {error:false, result:null}
  }

  runIf (if_statement) {
    return {error:false, result:null}
  }

  getVariable(varname) {
    return varname in this._locals ? this._locals[varname]:this._globals[varname]
  }

  evaluateExpression (expression) {
    switch (expression.expression_type) {
      case 'invocation':
        return this.getVariableValue(expression)
      case 'literal':
        this._state.stack.push({error:false, result:{type:'literal', value:expression.value}})
        break
      case  'operation':
        // return this.evaluateOperation(exp)
      case  'unary-operation':
        // return this.evaluateUnaryOperation(exp)
      case  'expression':
        // return this.evaluateExpression(exp.expression)
      default:
        break
    }
  }

  getVariableValue (info) {
    let variable = this.getVariable(info.name)

    if (variable.isArray) {
      let index_values = info.indexes.map(expression => this.evaluateExpression(expression) - 1)

      if (info.bounds_checked || this.indexWithinBounds(index_values, variable.dimension)) {
        let index = this.calculateIndex(index_values, variable.dimension)
        return {error:false, result:variable.values[index]}
      }
      else {
        let out_of_bunds_info = this.getBoundsError(index_values, variable.dimension)
        return {error:true, result:out_of_bunds_info}
      }
    }
    else {
      return variable.value
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
