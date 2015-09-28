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

describe('IntegerPattern', () => {
  let IntegerPattern = require('../frontend/structures/IntegerPattern.js')
  it('captura token entero', () => {
    let q = queueFromSource('36 a')

    let number = IntegerPattern.capture(q)

    number.error.should.equal(false)
    number.result.should.equal(36)
    q.current().kind.should.equal('word')
  })

  it('devuelve un error cuando el primer token en la cola no coincide', () => {
    let q = queueFromSource('papa 389'
  )
    let number = IntegerPattern.capture(q)

    number.error.should.equal(true)

    let info = number.result
    info.expectedToken.should.equal('integer')
    info.unexpectedToken.should.equal('word')
    info.atLine.should.equal(1)
    info.atColumn.should.equal(1)
    q.current().kind.should.equal('word')
  })
})

describe('IndexesPattern', () => {
  let IndexesPattern = require('../frontend/structures/IndexesPattern.js')

  it('captura el indice de un vector', () => {
    let q = queueFromSource('3')

    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3])
    q.current().kind.should.equal('eof')
  })

  it('captura los indices de una matriz', () => {
    let q = queueFromSource('3, 7')

    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3, 7])
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error al encontrar un token inesperado', () => {
    let q = queueFromSource('3, 7, 2.78')
    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(true)
    capture.result.unexpectedToken.should.equal('float')
    capture.result.atLine.should.equal(1)
    capture.result.atColumn.should.equal(7)
    q.current().kind.should.equal('float')
  })
})

describe('WordPattern', () => {
  let WordPattern = require('../frontend/structures/WordPattern.js')

  it('captura una palabra', () => {
    let q = queueFromSource('rodrigo')

    let capture = WordPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.equal('rodrigo')
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error cuando el patron no coincide', () => {
    let q = queueFromSource('32')

    let capture = WordPattern.capture(q)

    capture.error.should.equal(true)
    capture.result.should.deepEqual({
      expectedToken : 'word',
      unexpectedToken : 'integer',
      atColumn : 1,
      atLine : 1
    })
    q.current().kind.should.equal('integer')
  })
})

describe('VariableNamePattern', () => {
  let VariableNamePattern = require('../frontend/structures/VariableNamePattern.js')
  it('captura el nombre de una variable', () => {
    let q = queueFromSource('sueldo')

    let capture = VariableNamePattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      text    : 'sueldo',
      isArray : false
    })
  })

  it('captura el nombre de una matriz y sus dimensiones', () => {
    let q = queueFromSource('vuelos[3, 12]')

    let capture = VariableNamePattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual({
      text        : 'vuelos',
      isArray     : true,
      dimension   : [3, 12]
    })
  })
})

describe('VariableListPattern', () => {
  let VariableListPattern = require('../frontend/structures/VariableListPattern.js')
  it('lee las variables de una lista', () => {
    let q = queueFromSource('a, b, matriz[3, 3], v[8]')

    let capture = VariableListPattern.capture(q)

    capture.error.should.equal(false)
    capture.result[0].should.deepEqual({text:'a', isArray:false})
    capture.result[1].should.deepEqual({text:'b', isArray:false})
    capture.result[2].should.deepEqual({text:'matriz', isArray:true, dimension:[3, 3]})
    capture.result[3].should.deepEqual({text:'v', isArray:true, dimension:[8]})
    q.current().kind.should.equal('eof')
  })
})
