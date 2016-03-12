'use strict'

const Expression = require('./Expression')

class ExpressionIndexPattern {
  static capture(source) {
    let indexes = []

    let index_report = Expression.fromQueue(source)

    if (index_report.error === true) {
      return index_report
    }
    else {
      indexes.push(index_report.result)

      if (source.current().kind === 'comma') {
        source.next()

        let another_index_report = Expression.fromQueue(source)

        if (another_index_report.error === true) {
          return another_index_report
        }
        else {
          indexes = indexes.concat(another_index_report.result)

          return {error:false, result:indexes}
        }
      }
      else {
        return {error:false, result:indexes}
      }
    }
  }
}

module.exports = ExpressionIndexPattern
