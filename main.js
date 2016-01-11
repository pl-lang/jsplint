'use strict'

const Interpreter    = require('./backend/Interpreter.js')
const Scanner        = require('./frontend/Scanner')
const Source         = require('./frontend/Source')
const Parser         = require('./frontend/Parser')

function genericHandler(event_info) {
  console.log('Evento:', event_info.name)
  console.log('Origen:', event_info.origin)
  console.log('Args:', ...arguments, '\n')
}

class InterpreterController {
  constructor(config) {
    this.callbacks = {}

    this.on('any', genericHandler)

    this.emit({name:'test-event', origin:'controller'})
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

  setUpInterpreter(program_data) {
    this.interpreter = new Interpreter(program_data.main, {}) // TODO: agregar user_modules
    this.interpreter.on('any', genericHandler)
  }

  run(source_string) {
    let source_wrapper = new Source(source_string)
    let tokenizer = new Parser(source_wrapper)
    let scanner = new Scanner(tokenizer)

    this.emit({name:'scan-started', origin:'controller'})

    let scan_result = scanner.getModules()

    this.emit({name:'scan-finished', origin:'controller'})

    if (scan_result.error) {
      this.emit({name:'syntax-error', origin:'controller'}, scan_result.result)
    }
    else {
      this.emit({name:'correct-syntax', origin:'controller'})

      this.setUpInterpreter(scan_result.result)

      this.interpreter.run()
    }
  }
}

module.exports = InterpreterController
