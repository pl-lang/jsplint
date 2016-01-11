  'use strict'

const Evaluator       = require('./Evaluator.js')

class Interpreter {
  constructor(main, user_modules) {
    this.globalVariables = main.variables
    this.main_statements = main.statements
    this.user_modules = user_modules
    this.callbacks = {}

    this.mainEvaluator = new Evaluator(this.main_statements, this.globalVariables, this.globalVariables)
    this.mainEvaluator.on('write', (event_info, value_list) => {this.emit(event_info, value_list)})
    this.mainEvaluator.on('evaluation-error', (event_info) => {this.emit(event_info)})
  }

  on(event_name, callback) {
    this.callbacks[event_name] = callback
  }

  emit(event_info) {
    if (this.callbacks.hasOwnProperty(event_info.name)) {
      this.callbacks[event_info.name](...arguments)
    }

    if (this.callbacks.hasOwnProperty('any')) {
      this.callbacks.any(...arguments)
    }
  }

  run() {
    let done = false

    this.emit({name:'program-started', origin:'interpreter'})

    while (!done) {
      let state = this.mainEvaluator.runStatement()

      this.emit({name:'step-executed', origin:'interpreter'}, state.executed_statement)

      done = state.done
    }

    this.emit({name:'program-finished', origin:'interpreter'})
  }
}

module.exports = Interpreter
