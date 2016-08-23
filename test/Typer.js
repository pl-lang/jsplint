'use strict'
import should from 'should'

import Parser from '../src/parser/Parser.js'

import DeclarationTransform from '../src/transformer/Checkable.js'
import Typer from '../src/transformer/Typer.js'

import {check} from '../src/typechecker/TypeChecker.js'

import Evaluator from '../src/interpreter/Evaluator.js'

function programFromSource(string) {
  let parser = new Parser()

  let parser_output = parser.parse(string).result

  let executable_ast = DeclarationTransform(parser_output)

  return executable_ast
}

describe('Typer.js', () => {
  it('a ver que onda', () => {
    let code = `variables
      entero a
    inicio
      a <- falso
    fin`
    let parsed_code = programFromSource(code)

    let typer = new Typer(parsed_code)

    let transformend_modules = typer.transform(parsed_code.modules)

    console.log(transformend_modules)
    console.log(check(transformend_modules))
  })
})
