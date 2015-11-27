'use strict'

let DeclarationPattern = require('../structures/DeclarationPattern')
let AssignmentPattern = require('../structures/AssignmentPattern')

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind == 'eol') {
    current = source.next()
  }
}

class MainModuleScanner {

  static capture(source) {
    let moduleData = {
        localVariables  : {
            caracter  : []
          , logico    : []
          , entero    : []
          , real      : []
        }
      , statements      : []
      , atColumn        : 0
      , atLine          : 0
      , name            : 'main'
    }

    let current = source.current()

    if (current.kind == 'eol')
      skipWhiteSpace(source)

    if (current.kind != 'variables') {
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

    if (current.kind == 'eol')
      skipWhiteSpace(source)

    let varDeclaration = DeclarationPattern.capture(source)

    if (varDeclaration.error && !(varDeclaration.result.reason == 'nonexistent-type' && varDeclaration.result.unexpectedToken == 'inicio')) {
      return varDeclaration
    }
    else {
      moduleData.localVariables = varDeclaration.result
    }
    current = source.current()

    if (current.kind == 'eol')
      skipWhiteSpace(source)

    current = source.current()
    if (current.kind != 'inicio') {
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

    if (current.kind == 'eol')
      skipWhiteSpace(source)

    let fin_found = false
    let eof_found = false
    let error = false

    while (!fin_found && !eof_found) {
      current = source.current()

      if (current.kind == 'fin') {
        fin_found = true
      }
      else if (current.kind == 'eof') {
        eof_found = true
      }
      else if (current.kind == 'word') {
        let assignment = AssignmentPattern.capture(source)
        if (assignment.error) {
          return assignment
        }
        else {
          moduleData.statements.push(assignment.result)
        }
      }

      current = source.current()
      if (current.kind == 'eol')
        skipWhiteSpace(source)
    }

    if (eof_found && !fin_found) {
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

    return {error:false, result:moduleData}
  }
}

module.exports = MainModuleScanner
