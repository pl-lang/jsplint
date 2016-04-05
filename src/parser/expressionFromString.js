'use strict'

import SourceWrapper from './SourceWrapper.js'
import Lexer from './Lexer.js'

import TokenQueue from './TokenQueue.js'
import * as Patterns from './Patterns.js'
const match = Patterns.match

export default function expressionFromString(string) {
  let source = new SourceWrapper(string)
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
