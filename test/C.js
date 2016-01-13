'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

let Parser = require('../frontend/Parser.js')
let TokenQueue = require('../frontend/TokenQueue.js')

describe('Scanner', () => {
  let Scanner = require('../frontend/Scanner.js')
  it('genera correctamente los modulos de un programa (solo main)', () => {
    let programa = `
    variables
      entero a, b[1, 2]
    inicio
      a <- 32
    fin
    `

    let source = new Source(programa)
    let tokenizer = new Parser(source)

    let scanner = new Scanner(tokenizer)

    let scanResult = scanner.getModules()

    scanResult.error.should.equal(false)
  })
})
