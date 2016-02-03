'use strict'
const should = require('should');
const fs = require('fs');
const queueFromString = require('../auxiliary/queueFromString')

describe('Scanner', () => {
  let Scanner = require('../intermediate/Scanner')
  it('genera correctamente los modulos de un programa (solo main)', () => {
    let programa = `
    variables
      entero a, b[1, 2]
    inicio
      a <- 32
    fin
    `
    let q = queueFromString(programa)

    let scanner = new Scanner(q)

    let scanResult = scanner.getModules()

    scanResult.error.should.equal(false)
  })
})
