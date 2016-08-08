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

    this._evaluator = new Evaluator(program_modules)
    this.running = true
    this.paused = false

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

    while (this.running && done == false) {

      let evaluation_report = this._evaluator.step()

      if (evaluation_report.done || evaluation_report.error) {
        done = true
      }

      if (evaluation_report.error === false) {
        if (evaluation_report.output !== null) {
          if (evaluation_report.output.action === 'write') {
            this.emit('write', evaluation_report.output.value)
          }
          else if (evaluation_report.output.action === 'read') {
            this.paused = true
            this.running = false
            // de momento, tengo que mandar un arreglo en los eventos de lectura
            this.emit('read', [1])
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
      this._evaluator.input(value)
    }
  }
}
