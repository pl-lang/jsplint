'use strict'

class Evaluator {
  constructor(statements, localVariables, globalVariables) {
    this.globalVariables = globalVariables
    this.localVariables = localVariables
    this.statements = statements
  }

  run() {
    for (let statement of this.statements) {
      switch (statement.action) {
        case 'assignment':
        // Habria que buscar la variable objetivo (primero entre las locales, lueglo entre las locales)
        this.localVariables[statement.target].value = statement.payload
        break
      }
    }
  }
}

module.exports = Evaluator
