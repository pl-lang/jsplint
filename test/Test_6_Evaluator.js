'use strict'
import should from 'should'
import fs from 'fs'

import SourceWrapper from '../src/parser/SourceWrapper.js'
import Lexer from '../src/parser/Lexer.js'

import MainModuleScanner from '../src/parser/scanners/MainModuleScanner.js'
import StatementCollector from '../src/parser/scanners/StatementCollector.js'

import Evaluator from '../src/interpreter/Evaluator.js'
import Interpreter from '../src/interpreter/Interpreter.js'

import TokenQueue from '../src/parser/TokenQueue.js'
import * as Patterns from '../src/parser/Patterns.js'
const match = Patterns.match

function queueFromSource(string) {
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

describe('Evaluator', () => {
  let evaluator = new Evaluator([], {}, {})
  it('multiplicacion', () => {
    // 2*3
    {
      let a = '2*3'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(6)
    }

    // -2*-3
    {
      let a = '-2*-3'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(6)
    }

    // 2*2*2
    {
      let a = '2*2*2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(8)
    }
  })

  it('division', () => {
    {
      let a = '3/2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(1.5)
    }

    {
      let a = '-3/-2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(1.5)
    }

    {
      let a = '2+3/3+4'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(2+3/3+4)
    }

    {
      let a = '3/2/2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(3/2/2)
    }

    {
      let a = '2/2/2/2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(2/2/2/2)
    }

    {
      let a = '4/2/2/2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(4/2/2/2)
    }

    {
      let a = '2/2/2/4'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(2/2/2/4)
    }
  })

  it('resta', () => {
    {
      let a = '3-3-3'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(-3)
    }

    {
      let a = '(3-3-3)'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(-3)
    }
  })

  it('suma', () => {
    {
      let a = '2+43'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(45)
    }
  })

  it('operaciones combinadas', () => {
    {
      let a = '2-(2-3)'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(2-(2-3))
    }

    {
      let a = '2+(2+3)'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(7)
    }

    {
      let a = '2+(2+3*4)'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(16)
    }

    {
      let a = '(3*2)-6'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(0)
    }

    {
      let a = '(-(-(2+2)))'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(4)
    }

    {
      let a = '2+8/2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(2+8/2)
    }
  })

  it('relacionales', () => {
    {
      let a = '2 = 2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(true)
    }

    {
      let a = '2 <> 2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(false)
    }

    {
      let a = '2 >= 2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(true)
    }

    {
      let a = '2 <= 2'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(true)
    }

    {
      let a = '5 > 4'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(true)
    }

    {
      let a = '2 < 4'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(true)
    }

    {
      let a = 'verdadero or falso'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(true)
    }

    {
      let a = 'verdadero and falso'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal(false)
    }
  })

  it('prueba que no deberia fallar', () => {
    let a = '2 + 2 = 4'
    let q = queueFromSource(a)
    let exp = match(Patterns.Expression).from(q)
    exp.error.should.equal(false)
    let resultado = evaluator.evaluateExp(exp.result)
    resultado.should.equal(true)
  })

  it('cadenas', () => {
    {
      let a = '"hola"'
      let q = queueFromSource(a)
      let exp = match(Patterns.Expression).from(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateExp(exp.result)
      resultado.should.equal('hola')
    }
  })
})

describe('StatementCollector', () => {
  it('si-entonces', () => {
    let if_block = 'si (verdadero) entonces \n escribir("verdadero") \n finsi \n'
    let q = queueFromSource(if_block)

    let statements = StatementCollector.capture(q)

    statements.error.should.equal(false)
  })
})
