'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

describe('Source:', () => {
  it('funciona correctamente', () => {
    let string = fs.readFileSync('./test/ejemplo.md', 'utf-8')

    let source = new Source(string)

    source._currentLineIndex.should.equal(0)
    source._currentCharIndex.should.equal(0)
    source.currentChar().should.equal('1')

    source.nextChar().should.equal('2')
    source._currentLineIndex.should.equal(1)
    source._currentCharIndex.should.equal(0)

    source.nextChar().should.equal('3')
    source._currentLineIndex.should.equal(2)
    source._currentCharIndex.should.equal(0)

    source.nextChar().should.equal('4')
    source._currentLineIndex.should.equal(2)
    source._currentCharIndex.should.equal(1)

    source.nextChar().should.equal(source.EOF)
  })
})

describe('WordToken', () => {
  let WordToken = require('../frontend/tokens/WordToken.js')
  it('funciona correctamente', () => {
    let source = new Source('palabra123')

    let token = new WordToken(source)

    token.kind.should.equal('word')
    token.text.should.equal('palabra123')

    source = new Source('variables')
    token = new WordToken(source)

    token.kind.should.equal('variables')
    token.text.should.equal('variables')

    source = new Source('nombre24 chau')
    token = new WordToken(source)

    token.kind.should.equal('word')
    token.text.should.equal('nombre24')
  })
})

describe('NumberToken', () => {
  let NumberToken = require('../frontend/tokens/NumberToken.js')
  it('lee un entero', () => {
    let source = new Source('22')

    let token = new NumberToken(source)

    token.kind.should.equal('integer')
    token.text.should.equal('22')
    token.value.should.equal(22)
  })

  it('lee un real', () => {
    let  source = new Source('3.1487')
    let  token = new NumberToken(source)

    token.kind.should.equal('float')
    token.text.should.equal('3.1487')
    token.value.should.equal(3.1487)
  })

})
