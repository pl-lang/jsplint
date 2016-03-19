'use strict'

const Node = require('../../auxiliary/Node')

const Expression = require('./Expression')
const VariablePattern = require('./VariablePattern')

class AssignmentPattern {
  static capture(source) {

    let report = VariablePattern.capture(source)

    if (report.error === true) {
      return report
    }

    let name = report.result.name
    let isArray = report.result.isArray
    let indexes = report.result.indexes
    let bounds_checked = false
    let target = {name, isArray, indexes, bounds_checked}

    let current = source.current()

    if (current.kind === 'assignment') {
      source.next()

      let payload_report = Expression.fromQueue(source)

      if (payload_report.error === true) {
        return payload
      }
      else {
        let error = false
        let payload = payload_report.result
        let data = {action:'assignment', target, payload}
        let result = new Node(data)
        return {error, result}
      }
    }
    else {
      let error = true

      let unexpectedToken = source.current().kind
      let expectedToken   = 'assignment'
      let atColumn        = source.current().columnNumber
      let atLine          = source.current().lineNumber

      let result = {unexpectedToken, expectedToken, atColumn, atLine}

      return {error, result}
    }
  }
}

module.exports = AssignmentPattern
