'use strict'

/**
 * Responsabilidades de esta clase:
 *   - Manejar la pila de llamadas
 *   - Pasar los datos leidos al modulo que los haya pedido
 *   - Pasar el retorno de un modulo B al modulo A que lo llamó
 */

const Evaluator       = require('./Evaluator.js')
const Emitter         = require('../auxiliary/Emitter.js')

class Interpreter extends Emitter {
  constructor(main_module) {
    super(['program-started', 'program-paused', 'program-finished'])

    this._evaluator = new Evaluator()

    this.exposeChildrenEvents(this._evaluator)

    if (main_module) {
      this._current_program = main_module
      this._evaluator.local_vars = main_module.variables
      this._evaluator.global_vars = main_module.variables
      this.main_module_statements = main_module.statements
    }
  }

  set current_program(program_data) {
    this._current_program = program_data
    this._evaluator.local_vars = program_data.main.variables
    this._evaluator.global_vars = program_data.main.variables
    this.main_module_statements = program_data.main.statements
  }

  get current_program() {
    return this._current_program
  }

  run() {

    this.emit({name:'program-started', origin:'interpreter'})

    let evaluationReport = this._evaluator.runStatements(this.main_module_statements)

    this.emit({name:'program-finished', origin:'interpreter'})

    return evaluationReport
  }

  sendReadData(varname_list, data) {
    let i = 0
    while (this._state.ready && i < data.length) {
      this._evaluator.assignReadData(varname_list[i], data[i])
      i++
    }
    this._state.waiting_data = false
  }
}

module.exports = Interpreter
