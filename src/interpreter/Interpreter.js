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
import Emitter from '../utility/Emitter.js'

export default class Interpreter extends Emitter {
  constructor(program_modules) {
    super(['program-started', 'program-resumed', 'program-paused', 'program-finished'])
    this.current_program = program_modules
  }

  set current_program(program_modules) {
    this._current_program = program_modules
    let main = program_modules.main
    let main_evaluator = new Evaluator(main.root, main.locals, main.locals)
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

    let done = false
    this.current_module = this.stack.pop()

    while (this.running && done == false) {

      let evaluation_report = this.current_module.step()

      if (evaluation_report.done || evaluation_report.error) {
        done = true
      }

      if (evaluation_report.error === false) {
        if (evaluation_report.output !== null) {
          if (evaluation_report.output.action === 'write') {
            this.emit('write', evaluation_report.output.values)
          }
          else if (evaluation_report.output.action === 'read') {
            this.paused = true
            this.running = false
            // de momento, tengo que mandar un arreglo en los eventos de lectura
            this.emit('read', evaluation_report.output.types)
            this.stack.push(this.current_module)
          }
        }
      }
    }

    if (this.paused) {
      this.emit('program-paused')
    }
    else {
      this.emit('program-finished')
    }
  }

  sendReadData(varname_list, data) {
    for (let value of data) {
      this.current_module.input(value)
    }
  }
}
