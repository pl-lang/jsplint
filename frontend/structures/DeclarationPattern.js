'use strict'
let VariableListPattern = require('./VariableListPattern.js')
let TypePattern = require('./TypePattern.js')

class DeclarationPattern {
  static capture(source) {
    let declarations = {}

    let typename = TypePattern.capture(source)

    if (typename.error)
      return typename
    else {
      let varList = VariableListPattern.capture(source)

      if (varList.error)
        return varList
      else {
        for (let variable of varList.result) {
          let var_object = variable.data
          var_object.type = typename
          let name = variable.name
          declarations[name] = var_object
        }

        {
          let commaFound = false
          let eolFound = false
          if (source.current().kind === 'comma') {
            source.next()
            commaFound = true
          }
          else if (source.current().kind == 'eol') {
            source.next()
            eolFound = true
          }
          let nextDeclaration = this.capture(source)
          if ((commaFound || eolFound) && nextDeclaration.error && source.current().kind != 'inicio')
            return nextDeclaration
          else if (nextDeclaration.error === false) {
            for (let name in nextDeclaration.result)
              declarations[name] = nextDeclaration.result[name]
          }
        }

        return {
            result  : declarations
          , error   : false
        }
      }
    }
  }
}

module.exports = DeclarationPattern
