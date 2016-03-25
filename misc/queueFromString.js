'use strict'

const Source = require('../frontend/Source.js')
const Parser = require('../frontend/Parser.js')
const TokenQueue = require('../intermediate/TokenQueue')

function queueFromString(string) {
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

module.exports = queueFromString
