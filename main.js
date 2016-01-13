'use strict'

const Interpreter    = require('./backend/Interpreter.js')
const Emitter        = require('./auxiliary/Emitter.js')
const Scanner        = require('./intermediate/Scanner')
const Source         = require('./frontend/Source')
const Parser         = require('./frontend/Parser')

const defaults = {
  event_logging : true,
  step_by_step : false
}

function applyConfig(template, custom_options) {
  for (let option_name in template) {
    if ( !(option_name in custom_options) ) {
      custom_options[option_name] = template[option_name]
    }
  }
  return custom_options
}

function genericHandler(event_info) {
  console.log('Evento:', event_info.name)
  console.log('Origen:', event_info.origin)
  console.log('Args:', ...arguments, '\n')
}

class InterpreterController extends Emitter {
  constructor(config) {
    super(['scan-started', 'scan-finished', 'syntax-error', 'correct-syntax'])

    if (config) {
      this.config = applyConfig(defaults, config)
    }
    else {
      this.config = defaults
    }

    if (this.config.event_logging === true) {
      this.on('any', genericHandler)
    }
  }

  setUpInterpreter(program_data) {
    this.interpreter = new Interpreter(program_data.main, {}) // TODO: agregar user_modules

    this.exposeChildrenEvents(this.interpreter)
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
