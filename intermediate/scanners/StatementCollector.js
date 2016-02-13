'use strict'

const AssignmentPattern = require('../structures/AssignmentPattern')
const ModuleCallPattern = require('../structures/ModuleCallPattern')
const Expression = require('../structures/Expression.js')
const TokenQueue = require('../TokenQueue')
const BranchingNode = require('../../auxiliary/BranchingNode')
const LinkedList = require('../../auxiliary/List').LinkedList

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind == 'eol') {
    current = source.next()
  }
}

class WhileScanner {
  static capture(source) {
    let condition
    let body = []

    source.next() // consume 'mientras'

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    if (source.current().kind == 'left-par') {
      source.next()
    }
    else {
      let error = true
      let current = source.current()
      let unexpected = current.kind
      let expected = 'left-par'
      let atColumn = current.columnNumber
      let atLine = current.lineNumber
      let result = {unexpected, expected, atColumn, atLine}
      return {error, result}
    }

    // Esto arma un TokenQueue con los tokens de la condicion del bucle

    let token_array = []
    let current_token = source.current()

    while (current_token.kind != 'right-par' && current_token.kind != 'eof') {
      token_array.push(current_token)
      current_token = source.next()
    }

    if (source.current().kind == 'right-par') {
      source.next()
    }
    else {
      let error = true
      let current = source.current()
      let unexpected = current.kind
      let expected = 'right-par'
      let atColumn = current.columnNumber
      let atLine = current.lineNumber
      let result = {unexpected, expected, atColumn, atLine}
      return {error, result}
    }

    let expression_q = new TokenQueue(token_array)

    let condition_exp = Expression.fromQueue(expression_q)

    if (condition_exp.error) {
      return condition_exp
    }
    else {
      condition = condition_exp.result
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      body = statements.result
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    if (source.current().kind == 'finmientras') {
      source.next()
    }
    else {
      let error = true
      let current = source.current()
      let unexpected = current.kind
      let expected = 'finmientras'
      let atColumn = current.columnNumber
      let atLine = current.lineNumber
      let result = {unexpected, expected, atColumn, atLine}
      return {error, result}
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    let action = 'while'
    let error = false
    let result = {action, condition, body}

    return {error, result}
  }
}

class RepeatScanner {
  static capture(source) {
    let condition
    let body = []

    source.next()

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)


    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      body = statements.result
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    if (source.current().kind == 'hasta') {
      source.next()
    }
    else {
      return {
          error   : true
        , result  : {
            unexpected  : source.current().kind
          , expected    : 'hasta'
          , atColumn    : source.current().columnNumber
          , atLine      : source.current().lineNumber
        }
      }
    }

    if (source.current().kind == 'que') {
      source.next()
    }
    else {
      return {
          error   : true
        , result  : {
            unexpected  : source.current().kind
          , expected    : 'que'
          , atColumn    : source.current().columnNumber
          , atLine      : source.current().lineNumber
        }
      }
    }

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
        }
      }
    }

    let expression_q = new TokenQueue(token_array)

    let condition_exp = Expression.fromQueue(expression_q)

    if (condition_exp.error) {
      return condition_exp
    }
    else {
      condition = condition_exp.result
    }

    if (source.current().kind == 'eol')
      skipWhiteSpace(source)

    let error = false
    let action = 'repeat'
    let result = {action, condition, body}

    return {error, result}
  }
}

class IfScanner {
  static capture(source) {
    let condition
    let true_branch = new LinkedList()
    let false_branch = new LinkedList()
    let node = new BranchingNode()

    source.next() // consumir el 'si'

    if (source.current().kind == 'left-par') {
      source.next()
    } else {
      let error = true
      let result = {
          unexpected  : source.current().kind
        , expected    : 'left-par'
        , atColumn    : source.current().columnNumber
        , atLine      : source.current().lineNumber
        , reason      : 'missing-par-at-if'
      }
      return {error, result}
    }

    let token_array = []
    let current_token = source.current()

    while (current_token.kind != 'right-par' && current_token.kind != 'eof') {
      token_array.push(current_token)
      current_token = source.next()
    }

    if (current_token.kind == 'right-par') {
      source.next()
    } else {
      let error = true
      let result = {
          unexpected  : source.current().kind
        , expected    : 'right-par'
        , atColumn    : source.current().columnNumber
        , atLine      : source.current().lineNumber
        , reason      : 'missing-par-at-if'
      }
      return {error, result}
    }

    let expression_q = new TokenQueue(token_array)

    let condition_exp = Expression.fromQueue(expression_q)

    if (condition_exp.error) {
      return condition_exp
    }
    else {
      condition = condition_exp.result
    }

    if (source.current().kind == 'entonces') {
      source.next() // consumir el token
    } else {
      let error = false
      let result = {
          unexpected  : source.current().kind
        , expected    : 'entonces'
        , atColumn    : source.current().columnNumber
        , atLine      : source.current().lineNumber
        , reason      : 'missing-entonces-at-if'
      }
      return {error, result}
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


      node.leftBranchNode = true_branch.firstNode
      node.rightBranchNode = false_branch.firstNode
      let data = {condition, action:'if'}
      node.data = data

      let error = false
      let result = node

      return {error, result}
    } else {
      let error = true
      let result = {
          unexpected  : source.current().kind
        , expected    : ['finsi', 'sino']
        , atColumn    : source.current().columnNumber
        , atLine      : source.current().lineNumber
        , reason      : 'missing-sino-finsi-at-if'
      }
      return {error, result}
    }
  }
}

/**
 * Lo que StatementCollector debe devolver es el primer Nodo de una lista.
 * Los nodos tienen una propiedad que se llama next. Esta es una funcion que
 * devuelve una referencia al proximo nodo. Debe ser una funcion por que ciertos
 * nodos (como el while) deben devolver una referencia si se da una condicion
 * y otra referencia distinta si dicha condicion no se da.
 * En java (o typescript) Nodo seria una interfaz. Ya que aca no puedo usar eso,
 * escribí esto para explicar deben funcionar los nodos.
 */

class StatementCollector {
  static capture(source) {
    let result  = new LinkedList()
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
          result.addNode(call.result)
        }
      }
      else if (current.kind == 'word') {
        let assignment = AssignmentPattern.capture(source)
        if (assignment.error) {
          return assignment
        }
        else {
          result.addNode(assignment.result)
        }
      }
      else if (current.kind == 'si') {
        let if_block = IfScanner.capture(source)

        if (if_block.error) {
          return if_block
        }
        else {
          result.addNode(if_block.result)
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
