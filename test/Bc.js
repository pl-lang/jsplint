'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

let Parser = require('../frontend/Parser.js')
let TokenQueue = require('../frontend/TokenQueue.js')

function queueFromSource(string) {
  let source = new Source(string)
  let tokenizer = new Parser(source)

  let tokenArray = []
  let t = tokenizer.nextToken()

  while ( t.kind !== 'eof') {
    tokenArray.push(t)
    t = tokenizer.nextToken()
  }
  tokenArray.push(t)

  let q = new TokenQueue(tokenArray)

  return q
}

describe('MainModuleScanner', () => {
  let MainModuleScanner = require('../frontend/scanners/MainModuleScanner')
  it('leer un modulo principal', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let q = queueFromSource(programa)

    let mod_data = MainModuleScanner.capture(q)

    mod_data.error.should.equal(false)
  })
})

describe('Interpreter', () => {
  let MainModuleScanner = require('../frontend/scanners/MainModuleScanner')
  let Interpreter = require('../backend/Interpreter.js')
  it('ejecuta las acciones de un programa', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let q = queueFromSource(programa)

    let mod_data = MainModuleScanner.capture(q)

    let int = new Interpreter(mod_data.result, {})

    int.run()

    int.globalVariables.a.value.should.equal(48)
    int.globalVariables.b.value.should.equal(32)
  })
})
