'use strict'

const MessageHandler = require('./messages/MessageHandler')
const Interpreter    = require('./backend/Interpreter.js')
const Scanner        = require('./frontend/Scanner')
const Source         = require('./frontend/Source')
const Parser         = require('./frontend/Parser')

class InterpreterController extends MessageHandler {
  constructor(source_string) {
    super((message) => {
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

    this._source_string = source_string
    this.eventListeners = {}
  }

  get source_string() {
    return this._source_string
  }

  set source_string(val) {
    this._source_string = val
  }

  constructInterpreter() {
    this.interpreter = new Interpreter(this.scanResult.result.main, {}) // TODO: agregar user_modules
    this.interpreter.addMessageListener(this)
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
