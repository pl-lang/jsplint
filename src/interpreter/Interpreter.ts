'use strict'

/**
 * Eventos que emite:
 * 	- program-started
 * 	- program-paused
 * 	- program-finished
 * 	- evaluation-error
 *  - write
 *  - read
 */

import {Evaluator, Value} from './Evaluator'

import Emitter from '../utility/Emitter.js'

import {Program} from '../interfaces/Program'

export default class Interpreter extends Emitter {
  private evaluator: Evaluator
  running: boolean
  paused: boolean
  data_read: boolean

  constructor(p: Program) {
    super(['program-started', 'program-resumed', 'program-paused', 'program-finished'])

    this.evaluator = new Evaluator(p)
    this.running = true
    this.paused = false
    this.data_read = false
  }

  run() {

    // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
    // una llamada a leer
    if (this.paused && this.data_read) {
      this.emit('program-resumed')
      this.paused = false
      this.running = true
      this.data_read = false
    }
    else {
      this.emit('program-started')
    }

    let done = false

    while (this.running && done == false) {

      const evaluation_report = this.evaluator.step()

      if (evaluation_report.error) {
        done = true
        this.emit('evaluation-error', evaluation_report.result)
      }
      else if (evaluation_report.error == false) {
        switch (evaluation_report.result.action) {
          case 'read':
            this.emit('read')
            break
          case 'write':
            this.emit('write', evaluation_report.result.value)
          case 'none':
            break
          case 'paused':
            this.paused = true
            this.running = false
            break
        }
        done = evaluation_report.result.done
        if (done) {
          this.running = false
        }
      }
    }

    /**
     * Esto determina que evento emitir si la ejecucion sale del
     * bucle anterior. Hay dos motivos para salir de ese bucle:
     *  - el evaluador esta pausado esperando que finalice una lectura
     *  - hubo un error o el programa finalizó
     */
    if (this.paused) {
      this.emit('program-paused')
    }
    else {
      this.emit('program-finished')
    }
  }

  send (value: Value) {
    this.evaluator.input(value)
  }
}
