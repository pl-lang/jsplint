'use strict'

const WordPattern = require('./WordPattern')
const ArgumentListPattern = require('./ArgumentListPattern')
const Node = require('../../auxiliary/Node')

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
        if (source.current().kind == 'right-par') {
          source.next()
          let error = false
          let data = {
            args:args.result,
            name:name.result,
            action:'module_call',
            expression_type:'module_call'
          }
          let result = new Node(data)
          return {error, result}
        }
        else {
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
      }
    }
    else {
      source.next()
      let error = false
      let data = {
        args:[],
        name:name.result,
        action:'module_call',
        expression_type:'module_call'
      }
      let result = new Node(data)
      return {error, result}
    }
  }
}

module.exports = ModuleCallPattern
