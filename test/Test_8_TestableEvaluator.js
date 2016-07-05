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
})
