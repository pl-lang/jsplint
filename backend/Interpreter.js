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

    this.running = false
    this.stack = []

    this._evaluator = new Evaluator()

    this.exposeChildrenEvents(this._evaluator)
  }

  set current_program(program_data) {
    this._current_program = program_data
    let main = program_data.main
    let main_evaluator = new Evaluator(main.variables, main.variables, main.statements, {})
    // NOTE: exposeChildrenEvents va a ser reemplazada mas adelante
    this.exposeChildrenEvents(main_evaluator)
    this.stack = []
    this.stack.push(main_evaluator)
    this.running = true
  }

  get current_program() {
    return this._current_program
  }

  run() {

    this.emit({name:'program-started', origin:'interpreter'})

    let evaluation_report

    while (this.stack.length > 0 && this.running) {
      let current_module = this.stack.pop()
      evaluation_report = current_module.run()
      this.running = !evaluation_report.error
    }

    this.emit({name:'program-finished', origin:'interpreter'})

    return evaluation_report
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
