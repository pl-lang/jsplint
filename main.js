'use strict'

const MessageHandler = require('./messages/MessageHandler')
const Interpreter    = require('./backend/Interpreter.js')
const Scanner        = require('./frontend/Scanner')
const Source         = require('./frontend/Source')
const Parser         = require('./frontend/Parser')

class InterpreterController extends MessageHandler {
  constructor(config) {
    super((message) => {
      if (message.subject == 'escribir') {
        this.sendMessage(message)
      }
      else if (message.subject == 'leer') {
        this.sendMessage({subject:'leer'})
      }
      else if (message.subject == 'eval-error') {
        this.sendMessage(message)
      }
      else {
        this.sendMessage({subject:message.subject + ' - unknown subject'})
      }
    })

    this.eventListeners = {}
  }

  setUpInterpreter(program_data) {
    this.interpreter = new Interpreter(program_data.main, {}) // TODO: agregar user_modules
    this.interpreter.addMessageListener(this)
  }

  scan(source_string) {
    let source_wrapper = new Source(source_string)
    let tokenizer = new Parser(source_wrapper)
    let scanner = new Scanner(tokenizer)

    this.sendMessage({subject:'scan-started'})

    let scan_result = scanner.getModules()

    this.sendMessage({subject:'scan-finished'})

    if (scan_result.error) {
      this.sendMessage({subject:'incorrect-syntax', body:scan_result.result})
    }
    else {
      this.sendMessage({subject:'correct-syntax', body:scan_result.result})
    }
  }

  run(program_data) {
    this.interpreter.run()
  }
}

module.exports = InterpreterController
