'use strict'

const WordPattern = require('./WordPattern')
const IntegerIndexesPattern = require('./IntegerIndexesPattern') // por ahora

class Report {
  /**
   * Construye un reporte. Se usa para operaciones que pueden fallar.
   * @param  {bool} error_ocurred indica si ocurrió un error durante la operacion
   * @param  {any} result      resultado de la operación o causa del error
   * @return {Report}             reporte
   */
  constructor(error_ocurred, result) {
    this.error = error_ocurred
    this.result = result
  }
}

class VariablePattern {
  static capture(source) {
    let name = '', isArray = false, indexes = null

    let word_report = WordPattern.capture(source)

    if (word_report.error === true) {
      return word_report
    }
    else {
      name = word_report.result

      if (source.current().kind === 'left-bracket') {
        source.next()

        let index_expressions_report = IntegerIndexesPattern.capture(source)

        if (index_expressions_report.error === true) {
          return index_expressions_report
        }

        isArray = true
        indexes = index_expressions_report.result

        if (source.current().kind === 'right-bracket') {
          source.next()

          return new Report(false, {name, isArray, indexes})
        }
        else {
          let current = source.current()
          let unexpectedToken = current.kind
          let expectedToken   = 'right-bracket'
          let atColumn        = current.columnNumber
          let atLine          = current.lineNumber

          return new Report(true, {unexpectedToken, expectedToken, atColumn, atLine})
        }
      }
      else {
        return new Report(false, {name, isArray, indexes})
      }
    }
  }
}

module.exports = VariablePattern
