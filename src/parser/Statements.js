'use strict'

import Report from '../utility/Report.js'

import TokenQueue from '../TokenQueue.js'

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

  let left_hand_match = Variable(source)

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

  let right_hand_match = Expression(source)

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

  let expression_match = Expression(new TokenQueue(queue))

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
  let result = {
    type : 'while',
    condition : null,
    body = []
  }

  if (source.current().kind === 'mientras') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'mientras'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-mientras'
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

  let expression_match = Expression(new TokenQueue(queue))

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

  while ( /finmientras|eof/.test(source.current().kind) === false ) {
    let statement_match = match(AnyStatement).from(source)

    if (statement_match.error) {
      return statement_match.result
    }

    result.body.push(statement_match.result)
  }

  if (source.current().kind === 'finmientras') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'finmientras'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-finmientras'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  return new Report(false, result)
}

export function Until(source) {
  let result = {
    type : 'until',
    condition : null,
    body : []
  }

  if (source.current().kind === 'repetir') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'repetir'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-repetir'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  while ( /hasta|eof/.test(source.current().kind) === false ) {
    let statement_match = match(AnyStatement).from(source)

    if (statement_match.error) {
      return statement_match.result
    }

    result.body.push(statement_match.result)
  }

  if (source.current().kind === 'hasta') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'hasta'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-hasta'
    return new Report(true, {unexpected, expected, line, column, reason})
  }

  if (source.current().kind === 'que') {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = 'que'
    let line = current.lineNumber
    let column = current.columnNumber
    let reason = 'missing-que'
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

  let expression_match = Expression(new TokenQueue(queue))

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

  return new Report(false, result)
}

export function AnyStatement(source) {
  switch (source.current().kind) {
    case 'word':
      if (source.peek().kind === 'left-par') {
        return ModuleCall(source)
      }
      else {
        return Assignment(source)
      }
      break;
    case 'si':
      return If(source)
    case 'mientras':
      return While(source)
    case 'repetir':
      return Until(source)
    default: {
      let current = source.current()
      let unexpected = current.kind
      let expected = 'variable|funcion|procedimiento|si|mientras|repetir'
      let line = current.lineNumber
      let column = current.columnNumber
      let reason = 'missing-statement'
      return new Report(true, {unexpected, expected, line, column, reason})
    }
  }
}
