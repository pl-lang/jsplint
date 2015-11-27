'use strict'
let VariableListPattern = require('./VariableListPattern.js')
let TypePattern = require('./TypePattern.js')

class DeclarationPattern {
  static capture(source) {
    let declarations = {
        caracter  : []
      , logico    : []
      , entero    : []
      , real      : []
    }

    let typename = TypePattern.capture(source)

    if (typename.error)
      return typename
    else {
      let varList = VariableListPattern.capture(source)

      if (varList.error)
        return varList
      else {
        for (let varname of varList.result)
          declarations[typename.result].push(varname)

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
            for (let datatype in nextDeclaration.result)
              declarations[datatype] = declarations[datatype].concat(nextDeclaration.result[datatype])
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
