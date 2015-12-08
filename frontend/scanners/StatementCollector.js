'use strict'

const AssignmentPattern = require('../structures/AssignmentPattern')
const ModuleCallPattern = require('../structures/ModuleCallPattern')

function skipWhiteSpace(source) {
  let current = source.current()
  while (current.kind == 'eol') {
    current = source.next()
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
