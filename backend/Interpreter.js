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

const Evaluator       = require('./Evaluator.js')
const Emitter         = require('../auxiliary/Emitter.js')

class Interpreter extends Emitter {
  constructor(main_module) {
    super(['program-started', 'program-resumed', 'program-paused', 'program-finished'])
    this.current_program = main_module
  }

  set current_program(program_data) {
    this._current_program = program_data
    let main = program_data.main
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
      this.emit({name:'program-resumed', origin:'interpreter'})
      this.paused = false
      this.running = true
    }
    else {
      this.emit({name:'program-started', origin:'interpreter'})
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
      this.emit({name:'program-paused', origin:'interpreter'})
    }
    else {
      this.emit({name:'program-finished', origin:'interpreter'})
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
    let i = 0
    let error = false
    while (!error && i < data.length) {
      error = this.current_module.assignReadData(varname_list[i], data[i])
      i++
    }
    // Si hubo un error no hay que hacer nada ya que el evento apropiado ya ha
    // sido emitido por this.current_module
  }
}

module.exports = Interpreter
