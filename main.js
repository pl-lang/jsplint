'use strict'

const Interpreter    = require('./backend/Interpreter.js')
const Scanner        = require('./frontend/Scanner')
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

class InterpreterController {
  constructor(config) {
    this.callbacks = {}

    if (config) {
      this.config = applyConfig(defaults, config)
      console.log(this.config)
    }
    else {
      this.config = defaults
    }

    if (this.config.event_logging === true) {
      this.on('any', genericHandler)
    }

    this.emit({name:'test-event', origin:'controller'})
  }

  on(event_name, callback) {
    this.callbacks[event_name] = callback
  }

  emit(event_info) {
    // Se encarga de llamar a los callbacks de los eventos.
    // Si se registro un callback para 'any' entonces se lo llama para cada evento que sea emitido. Es el callback por defecto.
    // Si un evento tiene registrado un callback entonces este se ejecuta antes que el callback por defecto.
    if (this.callbacks.hasOwnProperty(event_info.name)) {
      this.callbacks[event_info.name](...arguments)
    }

    if (this.callbacks.hasOwnProperty('any')) {
      this.callbacks.any(...arguments)
    }
  }

  setUpInterpreter(program_data) {
    this.interpreter = new Interpreter(program_data.main, {}) // TODO: agregar user_modules

    if (this.config.event_logging === true) {
      this.interpreter.on('any', genericHandler)
    }

    if (this.callbacks.hasOwnProperty('write')) {
      this.interpreter.on('write', this.callbacks.write)
    }

    if (this.callbacks.hasOwnProperty('read')) {
      this.interpreter.on('read', this.callbacks.read)
    }
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
