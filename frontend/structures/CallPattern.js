'use strict'

let WordPattern = require('./WordPattern.js')
let ParameterListPattern = require('./ParameterListPattern.js')

class CallPattern {
  static capture(source) {
    let call = {}

    let moduleName = WordPattern.capture(source)

    if (moduleName.error) {
      moduleName.result.reason = 'bad-module-name'
      return moduleName
    }
    else {
      call.moduleName = moduleName.result
      let c = source.current()
      if (c.kind === 'left-par') {
        let c = source.next()
        if (c.kind === 'right-par') {
          call.parameters = []
          return {
              result  : call
            , error   : false
          }
        }
        else {
          let pList = ParameterListPattern.capture(source)
          if (pList.error) {
            return pList
          }
          else {
            c = source.current()
            if (c.kind === 'right-par') {
              call.parameters = pList.result
              return {
                  result  : call
                , error   : false
              }
            }
            else {
              return {
                  result  : {
                    unexpected  : c.kind
                  , expected    : 'right-par'
                  , atColumn    : c.columnNumber
                  , atLine      : c.lineNumber
                  , reason      : 'missing-right-par-in-module-call'
                }
                , error   : true
              }
            }
          }
        }
      }
      else {
        return {
            result  : {
              unexpected  : c.kind
            , expected    : 'left-par'
            , atColumn    : c.columnNumber
            , atLine      : c.lineNumber
            , reason      : 'missing-left-par-in-module-call'
          }
          , error   : true
        }
      }
    }
  }
}

module.exports = CallPattern
