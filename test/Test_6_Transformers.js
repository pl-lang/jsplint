'use strict'
import should from 'should'
import fs from 'fs'

import {bind} from '../src/utility/helpers.js'

import Parser from '../src/parser/Parser.js'

import * as Types from '../src/typechecker/Types.js'

import Declarator from '../src/transformer/Declarator.js'
import Typer from '../src/transformer/Typer.js'

function programFromSource(string) {
  let parser = new Parser()

  let parser_output = parser.parse(string).result

  return parser_output
}


describe('Declarator', () => {
  it('transforma un modulo main', () => {
    let code = `variables
      entero a, b
    inicio
    fin
    `

    let parser_output = programFromSource(code)

    let transformed_ast = Declarator(parser_output)

    transformed_ast.error.should.equal(false)
    transformed_ast.result.modules.should.deepEqual([
      {
        name: 'main',
        type: 'module',
        module_type: 'main',
        locals: {
          'a':{isArray:false, dimension:null, name:'a', type:'entero', value:null},
          'b':{isArray:false, dimension:null, name:'b', type:'entero', value:null}
        },
        body: []
      }
    ])
  })

  it('encuentra variables repetidas', () => {
    let code = `variables
      entero a, a
    inicio
    fin
    `

    let parser_output = programFromSource(code)

    let transformed_ast = Declarator(parser_output)

    transformed_ast.error.should.equal(true)
    transformed_ast.result.should.deepEqual([
      {reason:'repeated-variable', name:'a', original_type:'entero', repeated_type:'entero'}
    ])
  })
})

describe('Typer', () => {
  it('tipea un modulo principal', () => {
    let code = `variables
      entero a
    inicio
      a <- 2
    fin
    `

    let parser_output = programFromSource(code)

    let transformed_ast = bind(Typer, Declarator(parser_output))

    transformed_ast.error.should.equal(false)
    transformed_ast.result.main.should.deepEqual([
      {
        type: 'assignment',
        left: { indextypes: [], type: Types.Integer},
        right: [{kind:'literal', type_info:Types.Integer}]
      }
    ])
  })
})
