'use strict'

import Report from '../../misc/Report.js'

import Node from '../../misc/Node.js'
import IfNode from '../../misc/IfNode.js'
import WhileNode from '../../misc/WhileNode.js'
import UntilNode from '../../misc/UntilNode.js'

import { LinkedList, getChainLength, getLastNode } from '../../misc/List.js'

import TokenQueue from '../TokenQueue.js'

import * as Patterns from '../Patterns.js'
const match = Patterns.match

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind === 'eol') {
    current = source.next()
  }
}

class WhileScanner {
  static capture(source) {
    let condition
    let body = null
    let node = new WhileNode()

    source.next() // consume 'mientras'

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    if (source.current().kind === 'left-par') {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected = current.kind
      let expected = 'left-par'
      let atColumn = current.columnNumber
      let atLine = current.lineNumber
      return new Report(true, {unexpected, expected, atColumn, atLine})
    }

    // Esto arma un TokenQueue con los tokens de la condicion del bucle

    let token_array = []
    let current_token = source.current()

    while (current_token.kind != 'right-par' && current_token.kind != 'eof') {
      token_array.push(current_token)
      current_token = source.next()
    }

    if (source.current().kind === 'right-par') {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected = current.kind
      let expected = 'right-par'
      let atColumn = current.columnNumber
      let atLine = current.lineNumber
      return new Report(true, {unexpected, expected, atColumn, atLine})
    }

    let expression_q = new TokenQueue(token_array)

    let condition_exp = match(Patterns.Expression).from(expression_q)

    if (condition_exp.error) {
      return condition_exp
    }
    else {
      condition = condition_exp.result
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      body = statements.result
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    if (source.current().kind === 'finmientras') {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected = current.kind
      let expected = 'finmientras'
      let atColumn = current.columnNumber
      let atLine = current.lineNumber
      return new Report(true, {unexpected, expected, atColumn, atLine})
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    let action = 'while'

    node.data = {action, condition}
    node.loop_body_root = body

    return new Report(false, node)
  }
}

class RepeatScanner {
  static capture(source) {
    let condition
    let body_root_node = null

    source.next()

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)


    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      body_root_node = statements.result
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    if (source.current().kind === 'hasta') {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected  = current.kind
      let expected    = 'hasta'
      let atColumn    = current.columnNumber
      let atLine      = current.lineNumber

      return new Report(true, {unexpected, expected, atColumn, atLine})
    }

    if (source.current().kind === 'que') {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected  = current.kind
      let expected    = 'que'
      let atColumn    = current.columnNumber
      let atLine      = current.lineNumber

      return new Report(true, {unexpected, expected, atColumn, atLine})
    }

    if (source.current().kind === 'left-par') {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected  = current.kind
      let expected    = 'letf-par'
      let atColumn    = current.columnNumber
      let atLine      = current.lineNumber

      return new Report(true, {unexpected, expected, atColumn, atLine})
    }

    let token_array = []
    let current_token = source.current()

    while (current_token.kind != 'right-par' && current_token.kind != 'eof') {
      token_array.push(current_token)
      current_token = source.next()
    }

    if (current_token.kind === 'right-par') {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected  = current.kind
      let expected    = 'right-par'
      let atColumn    = current.columnNumber
      let atLine      = current.lineNumber

      return new Report(true, {unexpected, expected, atColumn, atLine})
    }

    let expression_q = new TokenQueue(token_array)

    let condition_exp = match(Patterns.Expression).from(expression_q)

    if (condition_exp.error) {
      return condition_exp
    }
    else {
      condition = condition_exp.result
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    let action = 'repeat'
    let data = {action, condition}

    let until_node = new UntilNode(data)
    until_node.loop_body_root = body_root_node

    let last_body_node = getLastNode(body_root_node)
    last_body_node.setNext(until_node)

    return new Report(false, body_root_node)
  }
}

class IfScanner {
  static capture(source) {
    let condition
    let true_branch = null
    let false_branch = null
    let node = new IfNode()

    source.next() // consumir el 'si'

    if (source.current().kind === 'left-par') {
      source.next()
    } else {
      let current = source.current()
      let unexpected  = source.current().kind
      let expected    = 'left-par'
      let atColumn    = source.current().columnNumber
      let atLine      = source.current().lineNumber
      let reason      = 'missing-par-at-if'

      return new Report(true, {unexpected, expected, atColumn, atLine, reason})
    }

    let token_array = []
    let current_token = source.current()

    while (current_token.kind !== 'right-par' && current_token.kind !== 'eof') {
      token_array.push(current_token)
      current_token = source.next()
    }

    if (current_token.kind ==='right-par') {
      source.next()
    } else {
      let current = source.current()
      let unexpected  = source.current().kind
      let expected    = 'right-par'
      let atColumn    = source.current().columnNumber
      let atLine      = source.current().lineNumber
      let reason      = 'missing-par-at-if'

      return new Report(true, {unexpected, expected, atColumn, atLine, reason})
    }

    let expression_q = new TokenQueue(token_array)

    let condition_exp = match(Patterns.Expression).from(expression_q)

    if (condition_exp.error) {
      return condition_exp
    }
    else {
      condition = condition_exp.result
    }

    if (source.current().kind === 'entonces') {
      source.next() // consumir el token
    } else {
      let current = source.current()
      let unexpected  = source.current().kind
      let expected    = 'entonces'
      let atColumn    = source.current().columnNumber
      let atLine      = source.current().lineNumber
      let reason      = 'missing-entonces-at-if'

      return new Report(true, {unexpected, expected, atColumn, atLine, reason})
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    let statements = StatementCollector.capture(source)

    if (statements.error) {
      return statements
    }
    else {
      true_branch = statements.result
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    if (source.current().kind === 'sino') {
      source.next() // consumir sino

      if (source.current().kind === 'eol')
        skipWhiteSpace(source)

      let statements = StatementCollector.capture(source)

      if (statements.error) {
        return statements
      }
      else {
        false_branch = statements.result
      }
    }

    if (source.current().kind === 'eol')
      skipWhiteSpace(source)

    if (source.current().kind === 'finsi') {
      source.next() // consumir finsi

      if (source.current().kind === 'eol')
        skipWhiteSpace(source)

      if (false_branch !== null) {
        node.leftBranchNode = false_branch
      }

      if (true_branch !== null) {
        node.rightBranchNode = true_branch
      }

      let data = {condition, action:'if'}
      node.data = data

      return new Report(false, node)
    } else {
      let current = source.current()
      let unexpected  = source.current().kind
      let expected    = ['finsi', 'sino']
      let atColumn    = source.current().columnNumber
      let atLine      = source.current().lineNumber
      let reason      = 'missing-sino-finsi-at-if'

      return new Report(true, {unexpected, expected, atColumn, atLine, reason})
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

export default class StatementCollector {
  static capture(source) {
    let list  = new LinkedList()

    let current = source.current()

    let done = false
    let eof_reached = current.kind === 'eof'

    while ( !eof_reached && !done) {
      current = source.current()

      if (current.kind === 'word' && source.peek().kind === 'left-par') {
        let call = match(Patterns.ModuleCall).from(source)
        if (call.error) {
          return call
        }
        else {
          list.addNode(new Node(call.result))
        }
      }
      else if (current.kind === 'word') {
        let assignment = match(Patterns.Assignment).from(source)
        if (assignment.error) {
          return assignment
        }
        else {
          list.addNode(new Node(assignment.result))
        }
      }
      else if (current.kind === 'si') {
        let if_block = IfScanner.capture(source)

        if (if_block.error) {
          return if_block
        }
        else {
          list.addNode(if_block.result)
        }
      }
      else if (current.kind === 'mientras') {
        let while_node = WhileScanner.capture(source)

        if (while_node.error) {
          return while_node
        }
        else {
          list.addNode(while_node.result)
        }
      }
      else if (current.kind === 'repetir') {
        let loop_body_root = RepeatScanner.capture(source)

        if (loop_body_root.error) {
          return loop_body_root
        }
        else {
          list.addNode(loop_body_root.result)
        }
      }
      else {
        done = true
      }
      current = source.current()
      if (current.kind === 'eol') {
        skipWhiteSpace(source)
      }
    }

    return new  Report(false, list.firstNode)
  }
}
