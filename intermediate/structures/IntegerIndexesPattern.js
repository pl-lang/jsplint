'use strict'

// TODO: hace falta reescribir esto?

let IntegerPattern = require('./IntegerPattern.js')

class IntegerIndexesPattern {
  static capture(source) {
    let indexes = []

    if (source.current().kind === 'entero') {
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
        , result : IntegerPattern.capture(source).result // Esto va a tirar informacion incorrecta sobre el error (xq source fue avanzada en el primer llamado, más arriba)
      }
    }
  }
}

module.exports = IntegerIndexesPattern
