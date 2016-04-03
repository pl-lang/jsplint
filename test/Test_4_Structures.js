'use strict'
const should = require('should');
const fs = require('fs');
const queueFromString = require('../misc/queueFromString')

describe('Captura de estructuras sintacticas', () => {
  const StatementCollector = require('../intermediate/scanners/StatementCollector');

  it('Captura la estructura si...entonces', () => {
    let code = `si (a) entonces
    a <- 32
    finsi
    `

    let q = queueFromString(code);

    let capture = StatementCollector.capture(q);

    capture.error.should.equal(false);

    let node = capture.result;

    node.data.condition.should.deepEqual({
      expression_type:'invocation',
      name:'a',
      isArray:false,
      indexes:null
    })

    node.rightBranchNode.data.should.deepEqual({
      action:'assignment',
      target:{
        name:'a',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload:{expression_type:'literal', type:'entero', value:32}
    })
  })

  it('Estructura mientras...', () => {
    let code = `mientras(a)
      a <- 32
    finmientras
    `;
    let q = queueFromString(code);

    console.log(q)

    let capture = StatementCollector.capture(q);

    capture.error.should.equal(false);

    let node = capture.result;

    node.data.condition.should.deepEqual({
      expression_type:'invocation',
      name:'a',
      isArray:false,
      indexes:null
    })

    node.loop_body_root.data.should.deepEqual({
      action:'assignment',
      target:{
        name:'a',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload:{expression_type:'literal', type:'entero', value:32}
    })
  })

  // IDEA: Cambiar la sintaxis ->> Reemplazar 'sino' por 'si no'
  it('Estructura si...entonces...si no...', () => {
    let code = `si (a) entonces
    a <- 32
    sino
    a <- 48
    finsi
    `

    let q = queueFromString(code);

    let capture = StatementCollector.capture(q);

    capture.error.should.equal(false);

    let node = capture.result;

    node.data.condition.should.deepEqual({
      expression_type:'invocation',
      name:'a',
      isArray:false,
      indexes:null
    })

    node.rightBranchNode.data.should.deepEqual({
      action:'assignment',
      target:{
        name:'a',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload:{expression_type:'literal', type:'entero', value:32}
    })

    node.leftBranchNode.data.should.deepEqual({
      action:'assignment',
      target:{
        name:'a',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload:{expression_type:'literal', type:'entero', value:48}
    })
  })

  it('Estructura repetir', () => {
    const getLastNode = require('../misc/List').getLastNode

    let code = `repetir
    a <- 32
    hasta que (verdadero)
    `

    let q = queueFromString(code);

    let capture = StatementCollector.capture(q)

    capture.error.should.equal(false)

    let first_node = capture.result
    let until_node = getLastNode(first_node)

    first_node.data.should.deepEqual({
      action:'assignment',
      target:{
        name:'a',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload:{expression_type:'literal', type:'entero', value:32}
    })

    first_node.getNext().should.equal(until_node)

    until_node.data.action.should.equal('repeat')

    until_node.data.condition.should.deepEqual({
      expression_type:'literal',
      type:'logico',
      value:true
    })
  })
})

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
