'use strict'

// Requisitos:
// [x] ModuleTable
// [x] MainModulePattern
// [ ] ModuleStruct
// [x] DeclarationPattern
// [ ] ModuleCallPattern
// [ ] AssignmentPattern
// [ ] IfPattern
// [ ] ForPattern
// [ ] WhilePattern
// [ ] RepeatPattern

let MainModuleScanner = require('./scanners/MainModuleScanner.js')
let ModuleTable = require('./ModuleTable.js')
let TokenQueue = require('./TokenQueue.js')

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
      console.log("Fin de programa alcanzado")
      return {
          result : modules
        , error  : false
      }
    }
    else {
      console.log("Fin no alcanzado, current:", q.current())
      return {error:true}
    }
  }
}

module.exports = Scanner
