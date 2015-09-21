"use strict"
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

describe("Source:", () => {
  it("works properly", () => {
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
