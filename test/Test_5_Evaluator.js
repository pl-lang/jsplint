'use strict'
const should = require('should');
const fs = require('fs');

const Source = require('../frontend/Source.js')
const Parser = require('../frontend/Parser.js')

const TokenQueue = require('../intermediate/TokenQueue')
const Patterns = require('../intermediate/Patterns')
const match = Patterns.match

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
  let MainModuleScanner = require('../intermediate/scanners/MainModuleScanner')
  it('leer un modulo principal', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let q = queueFromSource(programa)

    let mod_data = MainModuleScanner.capture(q)

    mod_data.error.should.equal(false)
  })

  it('leer un modulo con "escribir"', () => {
    let programa = 'variables\ninicio\nescribir(42)\nfin\n'
    let q = queueFromSource(programa)

    let mod_data = MainModuleScanner.capture(q)
    mod_data.error.should.equal(false)
  })
})

describe('Evaluator', () => {
  let Evaluator = require('../backend/Evaluator.js')
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
  let StatementCollector = require('../intermediate/scanners/StatementCollector')
  it('si-entonces', () => {
    let if_block = 'si (verdadero) entonces \n escribir("verdadero") \n finsi \n'
    let q = queueFromSource(if_block)

    let statements = StatementCollector.capture(q)

    statements.error.should.equal(false)
  })
})

describe.skip('Interpreter', () => {
  let MainModuleScanner = require('../intermediate/scanners/MainModuleScanner')
  let Interpreter = require('../backend/Interpreter.js')
  it('ejecuta las acciones de un programa', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- -32\nfin\n'
    let q = queueFromSource(programa)

    let mod_data = MainModuleScanner.capture(q)

    let int = new Interpreter(mod_data.result)

    int.run()

    int.current_program.variables.a.value.should.equal(48)
    int.current_program.variables.b.value.should.equal(-32)
  })
})
