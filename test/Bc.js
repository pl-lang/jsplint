'use strict'
var should = require('should');
var fs = require('fs');
var Source = require('../frontend/Source.js')

let Parser = require('../frontend/Parser.js')
let TokenQueue = require('../frontend/TokenQueue.js')

function queueFromSource(string) {
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

describe('MainModuleScanner', () => {
  let MainModuleScanner = require('../frontend/scanners/MainModuleScanner')
  it('leer un modulo principal', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let q = queueFromSource(programa)

    let mod_data = MainModuleScanner.capture(q)

    mod_data.error.should.equal(false)
  })
})

describe('Evaluator', () => {
  let ExpressionPattern = require('../frontend/structures/ExpressionPattern.js')
  let Evaluator = require('../backend/Evaluator.js')
  let evaluator = new Evaluator([], {}, {})
  it('multiplicacion', () => {
    // 2*3
    {
      let a = '2*3'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(6)
    }

    // -2*-3
    {
      let a = '-2*-3'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(6)
    }

    // 2*2*2
    {
      let a = '2*2*2'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(8)
    }
  })

  it('division', () => {
    {
      let a = '3/2'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(1.5)
    }

    {
      let a = '-3/-2'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(1.5)
    }

    // {
    //   let a = '2/2/2'
    //   let q = queueFromSource(a)
    //   let exp = ExpressionPattern.capture(q)
    //   exp.error.should.equal(false)
    //   let resultado = evaluator.evaluateTerms(exp.result.terms)
    //   resultado.should.equal(2/2/2)
    // }
  })

  it('resta', () => {
    {
      let a = '3-3-3'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(-3)
    }
  })

  it('suma', () => {
    {
      let a = '2+43'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(45)
    }
  })

  it('operaciones combinadas', () => {
    {
      let a = '2-(2-3)'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(3)
    }

    {
      let a = '2+(2+3)'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(7)
    }

    {
      let a = '2+(2+3*4)'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(16)
    }

    {
      let a = '(3*2)-6'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(0)
    }

    {
      let a = '(-(-(2+2)))'
      let q = queueFromSource(a)
      let exp = ExpressionPattern.capture(q)
      exp.error.should.equal(false)
      let resultado = evaluator.evaluateTerms(exp.result.terms)
      resultado.should.equal(4)
    }
  })
})

describe('Interpreter', () => {
  let MainModuleScanner = require('../frontend/scanners/MainModuleScanner')
  let Interpreter = require('../backend/Interpreter.js')
  it('ejecuta las acciones de un programa', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- -32\nfin\n'
    let q = queueFromSource(programa)

    let mod_data = MainModuleScanner.capture(q)

    let int = new Interpreter(mod_data.result, {})

    int.run()

    int.globalVariables.a.value.should.equal(48)
    int.globalVariables.b.value.should.equal(-32)
  })
})
