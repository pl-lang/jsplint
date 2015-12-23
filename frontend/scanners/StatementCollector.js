'use strict'

const AssignmentPattern = require('../structures/AssignmentPattern')
const ModuleCallPattern = require('../structures/ModuleCallPattern')
const Expression = require('../structures/Expression.js')
const TokenQueue = require('../TokenQueue')

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind == 'eol') {
    current = source.next()
  }
}

class IfScanner {
  static capture(source) {
    let condition
    let true_branch = []
    let false_branch = []

    source.next() // consumir el 'si'

    if (source.current().kind == 'left-par') {
      source.next()
    }
    else {
      return {
          error   : true
        , result  : {
            unexpected  : source.current().kind
          , expected    : 'left-par'
          , atColumn    : source.current().columnNumber
          , atLine      : source.current().lineNumber
          , reason      : 'missing-par-at-if'
        }
      }
    }

    let token_array = []
    let current_token = source.current()

    while (current_token.kind != 'right-par' && current_token.kind != 'eof') {
      token_array.push(current_token)
      current_token = source.next()
    }

    if (current_token.kind == 'right-par') {
      source.next()
    }
    else {
      return {
          error   : true
        , result  : {
            unexpected  : source.current().kind
          , expected    : 'right-par'
          , atColumn    : source.current().columnNumber
          , atLine      : source.current().lineNumber
          , reason      : 'missing-par-at-if'
        }
      }
    }

    let expression_q = new TokenQueue(token_array)

    let condition_exp = Expression.capture(expression_q)

    if (condition_exp.error) {
      return condition_exp
    }
    else {
      condition = condition_exp.result
    }

    if (source.current().kind == 'entonces') {
      source.next() // consumir el token
    }
    else {
      return {
          error   : true
        , result  : {
            unexpected  : source.current().kind
          , expected    : 'entonces'
          , atColumn    : source.current().columnNumber
          , atLine      : source.current().lineNumber
          , reason      : 'missing-entonces-at-if'
        }
      }
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      true_branch = statements.result
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    if (source.current().kind == 'sino') {
      source.next() // consumir sino

      if (source.current().kind == 'eol')
        skipWhiteSpace(source)

      let statements = StatementCollector.capture(source)

      if (statements.error) {
        return statements
      }
      else {
        false_branch = statements.result
      }
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    if (source.current().kind == 'finsi') {
      source.next() // consumir finsi

      if (source.current().kind == 'eol')
        skipWhiteSpace(source)


      let error = false
      let result = {condition, true_branch, false_branch, action:'if'}
      return {error, result}
    }
    else {
      return {
          error   : true
        , result  : {
            unexpected  : source.current().kind
          , expected    : ['finsi', 'sino']
          , atColumn    : source.current().columnNumber
          , atLine      : source.current().lineNumber
          , reason      : 'missing-sino-finsi-at-if'
        }
      }
    }
  }
}

class StatementCollector {
  static capture(source) {
    let result  = []
    let error   = false

    let current = source.current()

    let done = false
    let eof_reached = current.kind == 'eof'

    while ( !eof_reached && !done) {
      current = source.current()

      if (current.kind == 'word' && source.peek().kind == 'left-par') {
        let call = ModuleCallPattern.capture(source)
        if (call.error) {
          return call
        }
        else {
          result.push(call.result)
        }
      }
      else if (current.kind == 'word') {
        let assignment = AssignmentPattern.capture(source)
        if (assignment.error) {
          return assignment
        }
        else {
          result.push(assignment.result)
        }
      }
      else if (current.kind == 'si') {
        let if_block = IfScanner.capture(source)

        if (if_block.error) {
          return if_block
        }
        else {
          result.push(if_block.result)
        }
      }
      else {
        done = true
      }
      current = source.current()
      if (current.kind == 'eol') {
        skipWhiteSpace(source)
      }
    }

    return {error, result}
  }
}

module.exports = StatementCollector
