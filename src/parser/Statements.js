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

}

export function While(source) {

}

export function Until(source) {

}
