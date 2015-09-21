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
