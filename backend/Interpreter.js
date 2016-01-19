  'use strict'

const Evaluator       = require('./Evaluator.js')
const Emitter         = require('../auxiliary/Emitter.js')

class Interpreter extends Emitter {
  constructor(main_module) {
    super(['program-started', 'program-finished', 'step-executed'])

    this._state = {
      eval_error : false,
      ready : false
    }

    this._evaluator = new Evaluator()
    this._evaluator.on('evaluation-error', (event_info) => {
      this._state.eval_error = true
    })
    this.exposeChildrenEvents(this._evaluator)

    if (main_module) {
      this._state.ready = true
      this._current_program = main_module
      this._evaluator.local_vars = main_module.variables
      this._evaluator.global_vars = main_module.variables
      this.main_module_statements = main_module.statements
    }
  }

  set current_program(program_data) {
    this._state.ready = true
    this._current_program = program_data
    this._evaluator.local_vars = program_data.main.variables
    this._evaluator.global_vars = program_data.main.variables
    this.main_module_statements = program_data.main.statements
  }

  get current_program() {
    return this._current_program
  }

  run() {

    let i = 0

    this.emit({name:'program-started', origin:'interpreter'})

    while (this._state.ready && i < this.main_module_statements.length) {
      this._evaluator.runStatement(this.main_module_statements[i])

      this.emit({name:'step-executed', origin:'interpreter'})

      i++
    }

    this.emit({name:'program-finished', origin:'interpreter'})
  }

  sendReadData(varname_list, data) {
    let i = 0
    while (this._state.ready && i < data.length) {
      this._evaluator.assignReadData(varname_list[i], data[0])
      i++
    }
  }
}

module.exports = Interpreter
