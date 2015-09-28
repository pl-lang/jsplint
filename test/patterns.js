'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

let Parser = require('../frontend/Parser.js')
let TokenQueue = require('../frontend/TokenQueue.js')

describe('IntegerPattern', () => {
  let IntegerPattern = require('../frontend/structures/IntegerPattern.js')
  it('captura token entero', () => {
    let source = new Source('36 a')
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }

    let q = new TokenQueue(tokenArray)

    let number = IntegerPattern.capture(q)

    number.error.should.equal(false)
    number.result.should.equal(36)
    q.current().kind.should.equal('word')
  })

  it('devuelve un error cuando el primer token en la cola no coincide', () => {
    let source = new Source('papa 389')
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

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
    let source = new Source('3')
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3])
    q.current().kind.should.equal('eof')
  })

  it('captura los indices de una matriz', () => {
    let source = new Source('3, 7')
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

    let capture = IndexesPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.deepEqual([3, 7])
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error al encontrar un token inesperado', () => {
    let source = new Source('3, 7, 2.78')
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

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
    let source = new Source('rodrigo')
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

    let capture = WordPattern.capture(q)

    capture.error.should.equal(false)
    capture.result.should.equal('rodrigo')
    q.current().kind.should.equal('eof')
  })

  it('devuelve un error cuando el patron no coincide', () => {
    let source = new Source('32')
    let tokenizer = new Parser(source)

    let tokenArray = []
    let t = tokenizer.nextToken()

    while ( t.kind !== 'eof') {
      tokenArray.push(t)
      t = tokenizer.nextToken()
    }
    tokenArray.push(t)

    let q = new TokenQueue(tokenArray)

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
