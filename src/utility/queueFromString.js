'use strict'

import SourceWrapper from '../parser/SourceWrapper.js'
import Lexer from '../parser/Lexer.js'

import TokenQueue from '../parser/TokenQueue.js'

export default function queueFromString(string) {
  let source = new SourceWrapper(string)
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
