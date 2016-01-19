  'use strict'

const Evaluator       = require('./Evaluator.js')
const Emitter         = require('../auxiliary/Emitter.js')

class Interpreter extends Emitter {
  constructor(main_module) {
    super(['program-started', 'program-finished', 'step-executed'])

    this.evaluator = new Evaluator()
    this.exposeChildrenEvents(this.evaluator)

    if (main_module) {
      this._current_program = main_module
      this.evaluator.local_vars = main_module.variables
      this.evaluator.global_vars = main_module.variables
      this.main_module_statements = main_module.statements
    }
  }

  set current_program(program_data) {
    this._current_program = program_data
    this.evaluator.local_vars = program_data.main.variables
    this.evaluator.global_vars = program_data.main.variables
    this.main_module_statements = program_data.main.statements
  }

  get current_program() {
    return this._current_program
  }

  run() {
    let done = false

    let i = 0

    this.emit({name:'program-started', origin:'interpreter'})

    while (!done && i < this.main_module_statements.length) {
      this.evaluator.runStatement(this.main_module_statements[i])

      this.emit({name:'step-executed', origin:'interpreter'})

      i++
    }

    this.emit({name:'program-finished', origin:'interpreter'})
  }
}

module.exports = Interpreter
