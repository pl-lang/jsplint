'use strict'

const StatementCollector = require('./StatementCollector')

const Patterns = require('../Patterns')
const match = Patterns.match

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind === 'eol') {
    current = source.next()
  }
}

class MainModuleScanner {

  static capture(source) {
    let moduleData = {
        statements      : []
      , variables       : {}
      , atColumn        : 0
      , atLine          : 0
      , name            : 'main'
    }

    let current = source.current()

    if (current.kind === 'eol')
      skipWhiteSpace(source)

    if (current.kind !== 'variables') {
      return {
          error   : true
        , result  : {
            unexpected  : current.kind
          , expected    : 'variables'
          , atColumn    : current.columnNumber
          , atLine      : current.lineNumber
          , reason      : 'missing-var-declaration'
        }
      }
    }
    else {
      current = source.next()
    }

    if (current.kind === 'eol')
      skipWhiteSpace(source)

    let declaration_match = match(Patterns.Declaration).from(source)

    if (declaration_match.error && !(declaration_match.result.reason === 'nonexistent-type' && declaration_match.result.unexpected === 'inicio')) {
      return declaration_match
    }
    else {
      moduleData.variables = declaration_match.result
    }
    current = source.current()

    if (current.kind === 'eol')
      skipWhiteSpace(source)

    current = source.current()
    if (current.kind !== 'inicio') {
      return {
          error   : true
        , result  : {
            unexpected  : current.kind
          , expected    : 'inicio'
          , atColumn    : current.columnNumber
          , atLine      : current.lineNumber
          , reason      : 'missing-inicio'
        }
      }
    }
    else {
      current = source.next()
    }

    if (current.kind === 'eol')
      skipWhiteSpace(source)

    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      moduleData.statements = statements.result
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    current = source.current()

    if (current.kind !== 'fin') {
      return {
          error   : true
        , result  : {
            unexpected  : current.kind
          , expected    : 'fin'
          , atColumn    : current.columnNumber
          , atLine      : current.lineNumber
          , reason      : 'missing-fin'
        }
      }
    }
    else {
      source.next()
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    return {error:false, result:moduleData}
  }
}

module.exports = MainModuleScanner
