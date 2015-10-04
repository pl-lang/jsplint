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

let MainModulePattern = require('./structures/MainModulePattern.js')
let ModuleTable = require('./ModuleTable.js')
let TokenQueue = require('./TokenQueue.js')

class Scanner {
  constructor(parser, messageHandler) {
    this.parser = parser

    if (messageHandler)
      this.messageHandler = messageHandler

  }

  getModuleTable() {
    let t
    let tokenArray = []
    while ( (t = this.parser.nextToken()).kind !== 'eof') {
      tokenArray.push(t)
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

    let table = new ModuleTable()

    let mainModule = MainModulePattern.capture(q)

    // Por ahora, agregar la plantilla de main a la tabla no va a generar un error
    // porque se la agrega solo una vez, pero cuando esto esté dentro de un bucle
    // hay que guardar el retorno de add.
    // TODO: cambiar el nombre del modulo principal por otra cosa puesto que 'main' puede chocar
    // con el nombre del modulo de algun usuario
    if (mainModule.error === false)
      table.add(mainModule.result)
    else {
      // enviar mensaje con el error
      // por ahora, console.log :/
      console.log("ERROR on Scanner: ", mainModule.result.reason)
    }

    // Ahora, si el currentToken no es 'eof', habría que seguir buscando modulos
    // pero como todavía no tengo echos esos patterns, devuelvo la tabla solo
    // con el modulo principal

    return {
        result  : table
      , error   : false
    }
  }
}

module.exports = Scanner
