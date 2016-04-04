'use strict'

import Report from '../../misc/Report.js'

import StatementCollector from './StatementCollector.js'

import * as Patterns from '../Patterns'
const match = Patterns.match

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind === 'eol') {
    current = source.next()
  }
}

export default class MainModuleScanner {

  static capture(source) {
    let module_data = {
        statements      : []
      , variables       : {}
      , atColumn        : 0
      , atLine          : 0
      , name            : 'main'
    }

    let current = source.current()

    if (current.kind === 'eol') {
      skipWhiteSpace(source)
    }

    current = source.current()

    if (current.kind !== 'variables') {
      let unexpected  = current.kind
      let expected    = 'variables'
      let atColumn    = current.columnNumber
      let atLine      = current.lineNumber
      let reason      = 'missing-var-declaration'
      return new Report(true, {unexpected, expected, atColumn, atLine, reason})
    }
    else {
      current = source.next()
    }

    if (current.kind === 'eol') {
      skipWhiteSpace(source)
    }

    let declaration_match = match(Patterns.Declaration).from(source)

    if (declaration_match.error && !(declaration_match.result.reason === 'nonexistent-type' && declaration_match.result.unexpected === 'inicio')) {
      return declaration_match
    }
    else {
      module_data.variables = declaration_match.result
    }
    current = source.current()

    if (current.kind === 'eol') {
      skipWhiteSpace(source)
    }

    current = source.current()
    if (current.kind !== 'inicio') {
      let unexpected  = current.kind
      let expected    = 'inicio'
      let atColumn    = current.columnNumber
      let atLine      = current.lineNumber
      let reason      = 'missing-inicio'

      return new Report(true, {unexpected, expected, atColumn, atLine, reason})
    }
    else {
      current = source.next()
    }

    if (current.kind === 'eol') {
      skipWhiteSpace(source)
    }

    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      module_data.statements = statements.result
    }

    if (source.current().kind === 'eol') {
      skipWhiteSpace(source)
    }

    current = source.current()

    if (current.kind !== 'fin') {
      let unexpected  = current.kind
      let expected    = 'fin'
      let atColumn    = current.columnNumber
      let atLine      = current.lineNumber
      let reason      = 'missing-fin'

      return new Report(true, {unexpected, expected, atColumn, atLine, reason})
    }
    else {
      source.next()
    }

    if (source.current().kind === 'eol') {
      skipWhiteSpace(source)
    }

    return new Report(false, module_data)
  }
}
