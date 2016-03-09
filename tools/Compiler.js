'use strict'

const Emitter = require('../auxiliary/Emitter')
const Scanner = require('../intermediate/Scanner')
const TokenQueue = require('../intermediate/TokenQueue')
const Source = require('../frontend/Source')
const Parser = require('../frontend/Parser')
const TypeChecker = require('../analisys/TypeChecker')


class Compiler extends Emitter {
  /**
   * Esta clase convierte el programa del usuario (cadena de texto) a una
   * estructura de datos con los datos necesarios para evaluarlo. En el proceso
   * revisa que no contenga errores (y emite un evento si encuentra alguno)
   */

  /**
   * Eventos esta clase emite
   * 	- compilation-started
   * 	- lexical-error
   * 	- compilation-finished
   * 	- type-check-started (via TypeChecker)
   * 	- type-error (via TypeChecker)
   * 	- type-check-finished (via TypeChecker)
   */

  constructor(source_code_string) {
    super([
        'compilation-started']
      , 'lexical-error'
      , 'compilation-finished'
      , 'type-check-started'
      , 'type-error'
      , 'type-check-finished'
    )
    this.parser = new Parser()
  }

  compile(source_code_string) {
    this.emit({name:'compilation-started'})

    let source_wrapper = new Source(source_code_string)

    let parse_report = this.parser.parse(source_wrapper)

    if (parse_report.error) {
      for (let bad_token of parse_report.result) {
        this.emit({name:'lexical-error',  origin:'controller'}, bad_token)
      }
      this.emit({name:'compilation-finished', origin:'controller'}, {error:true, result:'parse_errors'})
      return {error:true, result:'parse_errors'}
    }

    let scanner = new Scanner(new TokenQueue(parse_report.result))

    let scan_report = scanner.getModules()

    if (scan_report.error) {
      this.emit({name:'syntax-error', origin:'controller'}, scan_report.result)

      this.emit({name:'compilation-finished', origin:'controller'}, {error:true, result:'syntax_error'})

      return {error:true, result:'syntax_error'}
    }

    let type_error = false

    let modules = scan_report.result

    let main = modules.main

    let type_checker = new TypeChecker(main.statements, {}, main.variables, main.variables)
    type_checker.on('type-error', () => {
      type_error = true
    })

    this.repeatAllPublicEvents(type_checker)

    type_checker.checkAssigmentNodes(main.statements)

    if (type_error) {
      this.emit({name:'compilation-finished'}, {error:true, result:'type_error'})
      return {error:true, result:'type_error'}
    }

    this.emit({name:'compilation-finished', origin:'controller'}, {error:false})

    return {error:false, result:scan_report.result}
  }
}

module.exports = Compiler
