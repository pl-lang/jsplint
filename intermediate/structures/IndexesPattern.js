'use strict'
let IntegerPattern = require('./IntegerPattern.js')

class IndexesPattern {
  static capture(source) {
    let indexes = []

    if (source.current().kind === 'integer') {
      indexes.push(IntegerPattern.capture(source).result)
      let current = source.current()

      if (current.kind === 'comma') {
        source.next()
        let list = this.capture(source)
        if (list.error)
          return list
        else {
          return {
              error  : false
            , result : indexes.concat(list.result)
          }
        }
      }
      else {
        return {
            error  : false
          , result : indexes
        }
      }

    }
    else {
      return {
          error  : true
        , result : IntegerPattern.capture(source).result
      }
    }
  }
}

module.exports = IndexesPattern
