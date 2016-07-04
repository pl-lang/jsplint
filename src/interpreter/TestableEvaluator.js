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
    this._locals = locals
    this._globals = globals
    this._state = {
      done: root_statement === null ? true:false,
      error: false,
      output: null,
      variables_awaiting_data: []
    }
  }

  step() {
    if (this._state.done || this._state.error || this._state.variables_awaiting_data.length > 0) {
      return {done:this._state.done, error:this._state.error, output:this._state.output}
    }
    else {
      let statement = this._current_node.data
      let output = null

      switch (statement.action) {
        case 'assignment':
          output = this.runAssignment(statement)
          break;
        case 'module_call':
          output = this.runCall(statement)
          break
        case 'if':
          output = this.runIf(statement)
          break
        case 'while':
          output = this.runWhile(statement)
          break
        case 'until':
          output = this.runUntil(statement)
          break
        default:
          throw new Error(`En TestableEvaluator: no se reconoce el enunciado ${statement.action}`)
          break
      }

      this._state.error = output.error
      this._state.output = output.result

      this._current_node = this._current_node.getNext()

      if (this._current_node === null) {
        this._state.done = true
      }

      return {done:this._state.done, error:this._state.error, output:output.result}
    }
  }

  runAssignment (assignment) {
    let variable = this.getVariable(assignment.target.name)

    if (variable.isArray) {
      // TODO: faltaria revisar si hubo un error al calcular un indice...
      // Eso solo podria ocurrir si uno de los indices fuera el resultado de
      // un llamado a una funcion y hubiera un error durante la evaluacion de esta
      let index_list = assignment.target.indexes.map(expression => this.evaluateExpression(expression) - 1)

      if (assignment.target.bounds_checked || this.indexWithinBounds(index_list, variable.dimension) ) {
        let index = this.calculateIndex(index_list, variable.dimension)
        let expression_report = this.evaluateExpression(assignment.payload)
        if (expression_report.error) {
          return {error:true, result:expression_report.result}
        }
        else {
          variable.values[index] = expression_report.result
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
        return {error:true, result}
      }
    }
    else {
      let expression_report = this.evaluateExpression(assignment.payload)
      if (expression_report.error) {
        return {error:true, result:expression_report.result}
      }
      else {
        variable.value = expression_report.result
      }
    }

    return {error:false, result:null}
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
}
