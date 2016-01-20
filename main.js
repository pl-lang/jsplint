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
  if (arguments.length > 1) {
    console.log('Callback args:', ...arguments, '\n')
  }
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

    this.interpreter = new Interpreter()

    this.exposeChildrenEvents(this.interpreter)

    if (this.config.event_logging === true) {
      this.on('any', genericHandler)
    }
  }

  compile(source_string) {
    let source_wrapper = new Source(source_string)
    let tokenizer = new Parser(source_wrapper)
    let scanner = new Scanner(tokenizer)

    this.emit({name:'compilation-started', origin:'controller'})

    let scan_result = scanner.getModules()

    this.emit({name:'compilation-finished', origin:'controller'})

    return scan_result
  }

  run(source_string) {

    let program = this.compile(source_string)

    if (program.error) {
      this.emit({name:'syntax-error', origin:'controller'}, program.result)
    }
    else {
      this.emit({name:'correct-syntax', origin:'controller'})

      this.interpreter.current_program = program.result

      this.interpreter.run()
    }
  }

  sendReadData(varname_list, data) {
    this.interpreter.sendReadData(varname_list, data)
  }
}

module.exports = InterpreterController
