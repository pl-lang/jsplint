'use strict'

// Requisitos:
// [x] MainModulePattern
// [ ] ModuleStruct
// [x] DeclarationPattern
// [ ] ModuleCallPattern
// [ ] AssignmentPattern
// [ ] IfPattern
// [ ] ForPattern
// [ ] WhilePattern
// [ ] RepeatPattern

const MainModuleScanner = require('./scanners/MainModuleScanner.js')
const TokenQueue = require('./TokenQueue.js')

class Scanner {
  constructor(parser, messageHandler) {
    this.parser = parser

    if (messageHandler)
      this.messageHandler = messageHandler

  }

  getModules() {
    let modules = {}
    let t
    let tokenArray = []
    while ( (t = this.parser.nextToken()).kind !== 'eof') {
      tokenArray.push(t)
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

    let main_data = MainModuleScanner.capture(q)

    if (main_data.error) {
      console.log(main_data)
    }
    else {
      modules.main = main_data.result
    }

    if (q.current().kind == 'eof') {
      return {
          result : modules
        , error  : false
      }
    }
    else {
      return {error:true}
    }
  }
}

module.exports = Scanner
