'use strict'

const Interpreter    = require('./backend/Interpreter.js')
const TokenQueue     = require('./intermediate/TokenQueue')
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
    super(['compilation-started', 'compilation-finished', 'lexical-error', 'syntax-error', 'correct-syntax'])

    this.state = {
      compilationError : false
    }

    if (config) {
      this.config = applyConfig(defaults, config)
    }
    else {
      this.config = defaults
    }

    this.parser = new Parser()

    this.interpreter = new Interpreter()

    this.exposeChildrenEvents(this.interpreter)

    if (this.config.event_logging === true) {
      this.on('any', genericHandler)
    }
  }

  compile(source_string) {
    this.emit({name:'compilation-started', origin:'controller'})

    let source_wrapper = new Source(source_string)

    let parserReport = this.parser.parse(source_wrapper);

    if (parserReport.error) {
      // Se encontro al menos un error lexico
      for (let bad_token of parserReport.result) {
        this.emit({name:'lexical-error',  origin:'controller'}, bad_token);
      }
      // emitir compilation-finished avisando que hubo errores
      this.emit({name:'compilation-finished', origin:'controller'}, {error:true});

      return {error:true}
    }

    let scanner = new Scanner(new TokenQueue(parserReport.result))

    let scanReport = scanner.getModules()

    if (scanReport.error) {
      this.emit({name:'syntax-error', origin:'controller'}, scanReport.result);

      this.emit({name:'compilation-finished', origin:'controller'}, {error:true});

      return {error:true}
    }

    this.emit({name:'correct-syntax', origin:'controller'});

    this.emit({name:'compilation-finished', origin:'controller'}, {error:false});

    return scanReport
  }

  run(source_string) {

    let program = this.compile(source_string)

    if (!program.error) {
      this.interpreter.current_program = program.result
      this.interpreter.run()
    }
  }

  sendReadData(varname_list, data) {
    this.interpreter.sendReadData(varname_list, data)
  }
}

module.exports = InterpreterController
