'use strict'

let MessageHandler = require('./messages/MessageHandler')
let Interpreter    = require('./backend/Interpreter.js')
let Scanner        = require('./frontend/Scanner')
let Source         = require('./frontend/Source')
let Parser         = require('./frontend/Parser')

class InterpreterController {
  constructor(source_string) {
    this.source_string = source_string
    this.eventListeners = {}

    this.message_handler = new MessageHandler((message) => {
      if (message.subject == 'escribir') {
        this.sendMessage(message)
      }
      else if (message.subject == 'leer') {
        this.sendMessage({subject:'leer'})
      }
      else if (message.subject == 'run') {
        this.scan()
        this.run()
      }
      else {
        this.sendMessage({subject:message.subject + ' - unknown subject'})
      }
    })
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

  constructInterpreter() {
    this.interpreter = new Interpreter(this.scanResult.result.main, {}) // TODO: agregar user_modules
    this.interpreter.addMessageListener(this.message_handler)
  }

  scan() {
    let source_wrapper = new Source(this.source_string)
    let tokenizer = new Parser(source_wrapper)
    this.scanner = new Scanner(tokenizer)

    this.sendMessage({subject:'scan-started'})

    this.scanResult = this.scanner.getModules()

    this.sendMessage({subject:'scan-finished'})

    if (this.scanResult.error) {
      this.sendMessage({subject:'syntax-errors'})
    }
    else {
      this.sendMessage({subject:'good-syntax'})
      this.constructInterpreter()
    }
  }

  run() {
    this.interpreter.run()
  }
}

module.exports = InterpreterController
