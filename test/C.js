'use strict'
const should = require('should');
const fs = require('fs');
const queueFromString = require('../auxiliary/queueFromString')

describe('Captura de estructuras sintacticas', () => {
  const StatementCollector = require('../intermediate/scanners/StatementCollector');

  it('Captura la estructura si...entonces', () => {
    let code = `si (a) entonces
    escribir(a)
    sino
    escribir(a)
    finsi
    `

    let q = queueFromString(code);

    let capture = StatementCollector.capture(q);

    capture.error.should.equal(false);

    let struct = capture.result[0];

    struct.condition.should.deepEqual({expression_type:'invocation', varname:'a'});

    struct.true_branch.should.deepEqual([{
      expression_type:'module_call',
      action:'module_call',
      name:'escribir',
      args:[
        {expression_type:'invocation', varname:'a'}
      ]}
    ]);

  });

  it('Estructura mientras...', () => {
    let code = `
    mientras(a)
      escribir(a)
    finmientras
    `;
    let q = queueFromString(code);

    let capture = StatementCollector.capture(q);

    capture.error.should.equal(false);

    let struct = capture.result[0];

    struct.condition.should.deepEqual({expression_type:'invocation', varname:'a'});

    struct.body.should.deepEqual([{
      expression_type:'module_call',
      action:'module_call',
      name:'escribir',
      args:[
        {expression_type:'invocation', varname:'a'}
      ]}
    ]);

  });

});

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
