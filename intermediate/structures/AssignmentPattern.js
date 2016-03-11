'use strict'

const Node = require('../../auxiliary/Node')

const Expression = require('./Expression')
const VariableNamePattern = require('./VariableNamePattern')

class AssignmentPattern {
  static capture(source) {

    let report = VariableNamePattern.capture(source)

    if (report.error === true) {
      return report
    }

    let target = report.result.name
    let isArray = report.result.data.isArray
    let indexes = isArray === true ? report.result.data.dimension:null

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
        let data = {action:'assignment', target, isArray, indexes, payload}
        let result = new Node(data)
        return {error, result}
      }
    }
    else {
      let error = true

      let unexpectedToken = source.current().kind
      let expectedToken   = 'assignment'
      let atColumn        = source.current().atColumn
      let atLine          = source.current().atLine

      let result = {unexpectedToken, expectedToken, atColumn, atLine}

      return {error, result}
    }
  }
}

module.exports = AssignmentPattern
