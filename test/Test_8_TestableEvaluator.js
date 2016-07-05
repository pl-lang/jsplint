'use strict'
import should from 'should'

import Parser from '../src/parser/Parser.js'

import StaticChecker from '../src/typechecker/TypeChecker.js'

import DeclarationTransform from '../src/transformer/Checkable.js'
import EvaluatorTransform from '../src/transformer/Interpretable.js'


import TestableEvaluator from '../src/interpreter/TestableEvaluator.js'

function programFromSource(string) {
  let parser = new Parser()

  let checker = new StaticChecker()

  checker.on('type-error', (...args) => {
    console.log(...args)
    throw new Error('Programa con error de tipado en una de las pruebas')
  })

  let parser_output = parser.parse(string).result

  let executable_ast = EvaluatorTransform(DeclarationTransform(parser_output))

  return executable_ast
}


describe('TestableEvaluator', () => {
  it('programa sin enunciados', () => {
    let code = `variables
    inicio
    fin
    `
    let modules = programFromSource(code).modules

    let evaluator = new TestableEvaluator(modules.main.root, modules.main.locals, modules.main.locals)

    let output = evaluator.step()

    output.should.deepEqual({
      done:true,
      error:false,
      output:null
    })
  })

  it('programa con una asignacion a una variable', () => {
    let code = `variables
      entero a
    inicio
      a <- 2
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new TestableEvaluator(modules.main.root, modules.main.locals, modules.main.locals)

    let output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator._locals.a.value.should.equal(2)
  })

  it('programa con una asignacion a un vector', () => {
    let code = `variables
      entero v[5]
    inicio
      v[1] <- 5
      v[2] <- 8
      v[3] <- 7
      v[4] <- 9
      v[5] <- 3
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new TestableEvaluator(modules.main.root, modules.main.locals, modules.main.locals)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator._locals.v.values[0].should.equal(5)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator._locals.v.values[1].should.equal(8)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator._locals.v.values[2].should.equal(7)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator._locals.v.values[3].should.equal(9)

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})
    evaluator._locals.v.values[4].should.equal(3)
  })

  it('programa con una asignacion a una matriz', () => {
    let code = `variables
      entero m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      m[2, 1] <- 7
      m[2, 2] <- 9
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new TestableEvaluator(modules.main.root, modules.main.locals, modules.main.locals)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator._locals.m.values[0].should.equal(5)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator._locals.m.values[1].should.equal(8)

    output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})
    evaluator._locals.m.values[2].should.equal(7)

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})
    evaluator._locals.m.values[3].should.equal(9)
  })

  it('programa con 2 enunciados de asignacion', () => {
    let code = `variables
      entero a, b
    inicio
      a <- 25
      b <- 89
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new TestableEvaluator(modules.main.root, modules.main.locals, modules.main.locals)

    let output = evaluator.step()

    output.should.deepEqual({done:false, error:false, output:null})

    evaluator._locals.a.value.should.equal(25)

    output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:null})

    evaluator._locals.b.value.should.equal(89)
  })

  it('programa con un llamado a escribir de un solo argumento', () => {
    let code = `variables
    inicio
      escribir(4)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new TestableEvaluator(modules.main.root, modules.main.locals, modules.main.locals)

    let output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[4]}})
  })

  it('programa con un llamado a escribir con varios argumentos', () => {
    let code = `variables
    inicio
      escribir(4, 3, 2, 1)
    fin`

    let modules = programFromSource(code).modules

    let evaluator = new TestableEvaluator(modules.main.root, modules.main.locals, modules.main.locals)

    let output = evaluator.step()

    output.should.deepEqual({done:true, error:false, output:{action:'write', values:[4, 3, 2, 1]}})
  })
})
