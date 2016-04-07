'use strict'

import Emitter from '../utility/Emitter.js'

import Scanner from './Scanner.js'
import TokenQueue from './TokenQueue.js'

import SourceWrapper from './SourceWrapper.js'
import Lexer from './Lexer.js'

import TypeChecker from '../typechecker/TypeChecker.js'

import * as Patterns from './Patterns.js'
const match = Patterns.match

const defaults = {
  event_logging : false
}

/**
 * Dados un objeto plantilla y otro con opciones personalizadas devuelve un
 * objeto con todas las propiedades de la plantilla y con los valores
 * personalizados del segundo objeto
 * @param  {object} template       objeto que se usa como plantilla
 * @param  {object} custom_options objeto con opciones personalizadas
 * @return {object}                mezcla de la plantilla y las opciones
 * personalizadas
 */
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

export default class Compiler extends Emitter {
  /**
   * Esta clase convierte el programa del usuario (cadena de texto) a una
   * estructura de datos con los datos necesarios para evaluarlo. En el proceso
   * revisa que no contenga errores (y emite un evento si encuentra alguno)
   */

  /**
   * Eventos esta clase emite
   * 	- compilation-started
   * 	- lexical-error
   * 	- syntax-error
   * 	- compilation-finished
   * 	- type-check-started (via TypeChecker)
   * 	- type-error (via TypeChecker)
   * 	- type-check-finished (via TypeChecker)
   */

  constructor(config) {
    super([
        'compilation-started'
      , 'lexical-error'
      , 'syntax-error'
      , 'compilation-finished'
      , 'type-check-started'
      , 'type-error'
      , 'type-check-finished'
    ])

    if (config) {
      this.config = applyConfig(defaults, config)
    }
    else {
      this.config = defaults
    }

    if (this.config.event_logging) {
      this.on('any', genericHandler)
    }

    this.parser = new Lexer()
  }

  compile(source_code_string, run_type_checker) {

    this.emit('compilation-started')

    let source_wrapper = new SourceWrapper(source_code_string)

    let parse_report = this.parser.tokenize(source_wrapper)

    if (parse_report.error) {
      for (let bad_token of parse_report.result) {
        this.emit('lexical-error', bad_token)
      }
      this.emit('compilation-finished', {error:true, result:'parse_errors'})
      return {error:true, result:'parse_errors'}
    }

    let scanner = new Scanner(new TokenQueue(parse_report.result))

    let scan_report = scanner.getModules()

    if (scan_report.error) {
      this.emit('syntax-error', scan_report.result)

      this.emit('compilation-finished', {error:true, result:'syntax_error'})

      return {error:true, result:'syntax_error'}
    }

    if (run_type_checker) {
      let type_error = false

      let modules = scan_report.result

      let main = modules.main

      let type_checker = new TypeChecker(main.statements, {}, main.variables, main.variables)

      // TODO: agregar a Emitter la posibilidad de tener handlers que se
      // ejecuten solo una vez

      let error_info = null

      type_checker.on('type-error', (ev_info, error_report) => {
        type_error = true
        error_info = error_report
      })

      this.repeatAllPublicEvents(type_checker)

      type_checker.lookForErrors()

      if (type_error) {
        this.emit('compilation-finished', {error:true, result:error_info})
        return {error:true, result:'type_error'}
      }
    }

    this.emit('compilation-finished', {error:false})

    return {error:false, result:scan_report.result}
  }
}
