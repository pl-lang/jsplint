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
          var_object.type = typename.result
          let name = variable.name

          if (declarations.hasOwnProperty(name)) {
            return {
                result  : {reason:'repeatead-var-name'}
              , error   : true
            }
          }
          else {
            declarations[name] = var_object
          }
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
            for (let name in nextDeclaration.result) {
              if (declarations.hasOwnProperty(name)) {
                return {
                    result  : {reason:'repeatead-var-name'}
                  , error   : true
                }
              }
              else {
                declarations[name] = nextDeclaration.result[name]
              }
            }
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
