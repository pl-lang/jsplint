'use strict'

import Source from '../frontend/Source.js'
import Lexer from '../frontend/Lexer.js'

import TokenQueue from '../intermediate/TokenQueue'

export default function queueFromString(string) {
  let source = new Source(string)
  let tokenizer = new Lexer(source)

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
