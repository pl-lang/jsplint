'use strict'

let WordPattern = require('./WordPattern')
let ArgumentListPattern = require('./ArgumentListPattern')

class ModuleCallPattern {
  static capture(source) {
    let name = WordPattern.capture(source)

    if (source.current().kind != 'left-par') {
      return {
          result  : {
              unexpected  : source.current().kind
            , expected    : 'left-par'
            , atColumn    : source.current().columnNumber
            , atLine      : source.current().lineNumber
          }
        , error   : true
      }
    }
    else {
      source.next()
    }

    if (source.current().kind != 'right-par') {

      let args = ArgumentListPattern.capture(source)

      if (args.error) {
        return arguments
      }
      else {
        return {error:false, result:{args:args.result, name:name.result, action:'module_call', expression_type:'module_call'}}
      }

      return {
          result  : {
              unexpected  : source.current().kind
            , expected    : 'right-par'
            , atColumn    : source.current().columnNumber
            , atLine      : source.current().lineNumber
          }
        , error   : true
      }
    }
    else {
      source.next()

      return {error:false, result:{args:[], name:name.result, action:'module_call', expression_type:'module_call'}}
    }
  }
}

module.exports = ModuleCallPattern
