'use strict'

const Source = require('../frontend/Source')
const Lexer = require('../frontend/Lexer')

const TokenQueue = require('./TokenQueue')
const Patterns = require('./Patterns')
const match = Patterns.match

function expressionFromString(string) {
  let source = new Source(string)
  let tokenizer = new Lexer(source)

  let tokenArray = []
  let t = tokenizer.nextToken()

  while ( t.kind !== 'eof') {
    tokenArray.push(t)
    t = tokenizer.nextToken()
  }
  tokenArray.push(t)

  let tokenq = new TokenQueue(tokenArray)

  return match(Patterns.Expression).from(tokenq)
}

module.exports = expressionFromString
