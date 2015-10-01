'use strict'

let DeclarationPattern = require('./DeclarationPattern.js')

class MainModulePattern {
  static capture(source) {
    let moduleData = {
        localVariables  : {
            caracter  : []
          , logico    : []
          , entero    : []
          , real      : []
        }
      , atColumn        : 0
      , atLine          : 0
      , name            : 'main'
    }

    let current = source.current()
    if (current.kind === 'variables') {
      moduleData.atColumn = current.columnNumber
      moduleData.atLine   = current.lineNumber
      source.next()
      let varDeclaration = DeclarationPattern.capture(source)
      current = source.current()
      if (current.kind !== 'inicio') {
        return {
            error   : true
          , result  : {
              unexpected  : current.kind
            , expected    : 'inicio'
            , atColumn    : current.columnNumber
            , atLine      : current.lineNumber
            , reason      : 'missing-inicio'
          }
        }
      }
      else {
        if (varDeclaration.error === false) {
          moduleData.localVariables = varDeclaration.result
        }
        current = source.next()
        // let statements = StatementListPattern.capture(source)
        if (current.kind === 'fin') {
          return {
              error   : false
            , result  : moduleData
          }
        }
        else {
          return {
              error   : true
            , result  : {
                unexpected  : current.kind
              , expected    : 'fin'
              , atColumn    : current.columnNumber
              , atLine      : current.lineNumber
              , reason      : 'missing-fin'
            }
          }
        }
      }
    }
    else {
      return {
          error   : true
        , result  : {
            unexpected  : current.kind
          , expected    : 'variables'
          , atColumn    : current.columnNumber
          , atLine      : current.lineNumber
          , reason      : 'missing-var-declaration'
        }
      }
    }
  }
}

module.exports = MainModulePattern
