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
})
