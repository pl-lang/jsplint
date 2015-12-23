  'use strict'

let MessageHandler  = require('../messages/MessageHandler')
let Evaluator       = require('./Evaluator.js')

class Interpreter {
  constructor(main, user_modules) {
    this.message_handler = new MessageHandler((message) => {
      if (message.subject == 'escribir') {
        this.sendMessage(message)
      }
    })
    this.globalVariables = main.variables
    this.main_statements = main.statements
    this.user_modules = user_modules
    this.mainEvaluator = new Evaluator(this.main_statements, this.globalVariables, this.globalVariables)
    this.mainEvaluator.addMessageListener(this.message_handler)
  }

  run() {
    this.mainEvaluator.start()
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

module.exports = Interpreter
