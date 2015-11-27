'use strict'

let Evaluator = require('./Evaluator.js')

class Interprete {
  constructor(main, user_modules) {
    this.globalVariables = main.variables
    this.main = main.statements
    this.user_modules = user_modules

    this.mainEvaluator = new Evaluator(this.main, this.globalVariables, this.globalVariables)
  }

  run() {
    this.mainEvaluator.run()
  }
}

module.exports = Interprete
