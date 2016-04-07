'use strict'

import Report from '../utility/Report.js'

import TokenQueue from '../TokenQueue.js'

import * as Patterns from '../Patterns.js'
const match = Patterns.match

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind === 'eol') {
    current = source.next()
  }
}

export function Assignment(source) {
  let result = {
    type : 'assignment',
    left : null,
    right : null
  }

  let left_hand_match = match(Patterns.Variable).from(source)

  if (left_hand_match.error) {
    return left_hand_match.result
  }

  result.left = left_hand_match.result

  if (source.current() !== 'assignment') {
    let current = source.current()
    let unexpected = current.kind
    let expected = '<-'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'bad-assignment-operator'
    return new Report(true, {unexpected, expected, line, column, reason})
  }
  else {
    source.next()
  }

  let right_hand_match = match(Patterns.Expression).from(source)

  if (right_hand_match.error) {
    return right_hand_match.result
  }

  result.right = right_hand_match.result

  return new Report(false, result)
}

export function If(source) {
  let result = {
    type : 'if',
    condition : null
    true_branch : [],
    false_branch :[]
  }

  if (source.current().kind === 'si') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'si'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-si'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'left-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = '('
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }


  let queue = []
  while ( /right\-par|eof|eol/.test(source.current().kind) === false ) {
    queue.push(source.current())
    source.next()
  }

  let expression_match = match(Patterns.Expression).from(new TokenQueue(queue))

  if (expression_match.error) {
    return expression_match.result
  }
  else {
    result.condition = expression_match.result
  }

  if (source.current().kind === 'right-par') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ')'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-par-at-condition'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'entonces') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'entonces'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-entonces'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  while ( /finsi|sino|eof/.test(source.current().kind) === false ) {
    let statement_match = match(AnyStatement).from(source)

    if (statement_match.error) {
      return statement_match.result
    }

    result.true_branch.push(statement_match.result)
  }

  if (source.current().kind === 'sino') {
    source.next()

    while ( /finsi|eof/.test(source.current().kind) === false ) {
      let statement_match = match(AnyStatement).from(source)

      if (statement_match.error) {
        return statement_match.result
      }

      result.false_branch.push(statement_match.result)
    }
  }

  if (source.current().kind === 'finsi') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'finsi'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-finsi'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  return new Report(false, result)
}

export function While(source) {

}

export function Until(source) {

}
