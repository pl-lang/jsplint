'use strict'

let MessageHandler  = require('../messages/MessageHandler')
let Evaluator       = require('./Evaluator.js')

class Interprete {
  constructor(main, user_modules) {
    this.message_handler = new MessageHandler()
    this.globalVariables = main.variables
    this.main_statements = main.statements
    this.user_modules = user_modules
    this.mainEvaluator = new Evaluator(this.main_statements, this.globalVariables, this.globalVariables)
  }

  run() {
    this.mainEvaluator.run()
  }

  sendMessage(message) {
    this.message_handler.sendMessage(message)
  }

  addMessageListener(listener) {
    this.message_handler.addMessageListener(listener)
  }

  removeMessageListener(listener) {
    this.message_handler.removeMessageListener(listener)
  }
}

module.exports = Interprete
