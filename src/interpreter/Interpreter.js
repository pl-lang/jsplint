'use strict'

/**
 * Responsabilidades de esta clase:
 *   - Manejar la pila de llamadas
 *   - Pasar los datos leidos al modulo que los haya pedido
 *   - Pasar el retorno de un modulo B al modulo A que lo llamó
 */

/**
 * Eventos que emite:
 * 	- program-started
 * 	- program-paused
 * 	- program-finished
 * 	- evaluation-error (repite el de un Evaluator)
 */

import Evaluator from './Evaluator.js'
import Emitter from '../misc/Emitter.js'

export default class Interpreter extends Emitter {
  constructor(program_modules) {
    super(['program-started', 'program-resumed', 'program-paused', 'program-finished'])
    this.current_program = program_modules
  }

  set current_program(program_modules) {
    this._current_program = program_modules
    let main = program_modules.main
    let main_evaluator = new Evaluator(main.variables, main.variables, main.statements, {})
    // NOTE: exposeChildrenEvents va a ser reemplazada mas adelante
    this.bindEvaluatorEvents(main_evaluator)
    this.stack = []
    this.stack.push(main_evaluator)
    this.running = true
    this.paused = false
    this.current_module = null
  }

  get current_program() {
    return this._current_program
  }

  run() {

    // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
    // una llamada a leer
    if (this.paused) {
      this.emit('program-resumed')
      this.paused = false
      this.running = true
    }
    else {
      this.emit('program-started')
    }

    let evaluation_report

    while (this.stack.length > 0 && this.running) {
      this.current_module = this.stack.pop()
      evaluation_report = this.current_module.run()
      // if 'module_return' in evaluation_report.result
      // pasar el valor al modulo que realizó la llamada
      if (!this.paused) {
        this.running = !evaluation_report.error
      }
    }

    if (this.paused) {
      this.emit('program-paused')
    }
    else {
      this.emit('program-finished')
    }

    return evaluation_report
  }

  bindEvaluatorEvents(evaluator) {
    this.repeat('write', evaluator, false)

    // Las llamadas a leer pausan la ejecucion para poder realizar la lectura
    evaluator.on('read', () => {
      this.running = false
      this.paused = true
      this.stack.push(this.current_module)
    })

    this.repeat('read', evaluator, false)
    evaluator.on('evaluation-error', this.evaluationErrorHandler)
    evaluator.on('module_call', this.moduleCallHandler)
  }

  moduleCallHandler() {
    // Poner el modulo (A) que realizó la llamada en la pila
    this.stack.push(this.current_module)
    // Poner el nuevo modulo (B) en la pila
    this.stack.push()
    // Luego dentro del bucle de run (cuando se reanude A ) se envía el retorno
    // de B a A
  }

  evaluationErrorHandler() {
    // Repetir este evento ?
  }

  sendReadData(varname_list, data) {
    this.current_module.assignReadData(varname_list, data)
  }
}
