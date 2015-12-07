'use strict'

let MessageHandler = require('./messages/MessageHandler')
let Interpreter    = require('./backend/Interpreter.js')
let Scanner        = require('./frontend/Scanner')
let Source         = require('./frontend/Source')
let Parser         = require('./frontend/Parser')

class InterpreterController {
  constructor(source_string) {
    this._source_string = source_string
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

  get source_string() {
    return this._source_string
  }

  set source_string(val) {
    this._source_string = val
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
    this.sendMessage({subject:'interpreter-ready'})
  }

  scan() {
    let source_wrapper = new Source(this._source_string)
    let tokenizer = new Parser(source_wrapper)
    this.scanner = new Scanner(tokenizer)

    this.sendMessage({subject:'scan-started'})

    this.scanResult = this.scanner.getModules()

    this.sendMessage({subject:'scan-finished'})

    if (this.scanResult.error) {
      this.sendMessage({subject:'syntax-errors', body:this.scanResult.result})
    }
    else {
      this.constructInterpreter()
      this.sendMessage({subject:'good-syntax'})
    }
  }

  run() {
    this.interpreter.run()
  }
}

module.exports = InterpreterController
