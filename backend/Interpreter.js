  'use strict'

const Evaluator       = require('./Evaluator.js')
const Emitter         = require('../auxiliary/Emitter.js')

class Interpreter extends Emitter {
  constructor(main, user_modules) {
    super(['program-started', 'program-finished', 'step-executed'])
    this.globalVariables = main.variables
    this.main_statements = main.statements
    this.user_modules = user_modules

    this.mainEvaluator = new Evaluator(this.main_statements, this.globalVariables, this.globalVariables)

    this.exposeChildrenEvents(this.mainEvaluator)
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
