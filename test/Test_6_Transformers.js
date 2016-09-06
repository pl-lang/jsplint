'use strict'
import should from 'should'
import fs from 'fs'

import {bind} from '../src/utility/helpers.js'

import Parser from '../src/parser/Parser.js'

import * as Types from '../src/typechecker/Types.js'

import CallDecorator from '../src/transformer/CallDecorator.js'
import Declarator from '../src/transformer/Declarator.js'
import Typer from '../src/transformer/Typer.js'

import {compose, curry} from 'ramda'

function programFromSource(string) {
  let parser = new Parser()

  parser.on('syntax-error', (...args) => {
    console.log(...args)
    throw new Error('Error de sintaxis en una prueba')
  })


  let parser_output = parser.parse(string).result

  return parser_output
}


describe('CallDecorator', () => {
  it('agrega datos de una funcion a un llamado', () => {
    let code = `variables
      entero a
    inicio
      func()
    fin

    entero funcion func(entero a)
    inicio
      retornar 2
    finfuncion
    `

    let parser_output = programFromSource(code)

    let transformed_ast = CallDecorator(parser_output)

    transformed_ast.error.should.equal(false)
    transformed_ast.result.should.deepEqual({
      main: {
        name: 'main',
        type: 'module',
        module_type: 'main',
        body: [
          {type:'declaration', variables:[{name:'a', isArray:false, dimension:[], type:'entero'}]},
          {type:'call', args:[], name:'func', module_type: 'function', return_type:'entero', parameters:[{name:'a', type:'entero', by_ref:false}]}
        ]
      },

      func: {
        name: 'func',
        type: 'module',
        module_type: 'function',
        parameters: [{name:'a', type:'entero', by_ref:false}],
        return_type: 'entero',
        body: [
          {type:'return', expression:[{type:'literal', value:2}]}
        ]
      }
    })
  })

  it('error al invocar variable con funcion inexistente', () => {
    let code = `variables
      entero v[2]
    inicio
      a[devolver_2()] <- 1
    fin`

    let parser_output = programFromSource(code)

    let transformed_ast = CallDecorator(parser_output)

    transformed_ast.error.should.equal(true)
    transformed_ast.result.should.deepEqual([
      {reason: '@call-undefined-function', name: 'devolver_2'}
    ])
  })
})

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
    transformed_ast.result.should.deepEqual({
      main: {
        name: 'main',
        type: 'module',
        module_type: 'main',
        locals: {
          'a':{isArray:false, dimension:[], name:'a', type:'entero', value:null},
          'b':{isArray:false, dimension:[], name:'b', type:'entero', value:null}
        },
        body: []
      }
    })
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
      entero a, entero b[7], c[2, 3]
      entero d[3, 3, 3]
    inicio
      a <- 2
      a <- a
      a <- b
      a <- c
      a <- d
    fin
    `

    let b_type = new Types.ArrayType(Types.Integer, 7)

    let c_type = new Types.ArrayType(new Types.ArrayType(Types.Integer, 3), 2)

    let d_type = new Types.ArrayType(new Types.ArrayType(new Types.ArrayType(Types.Integer, 3), 3), 3)

    let parser_output = programFromSource(code)

    let transform = compose(bind(Typer), Declarator)

    let transformed_ast = transform(parser_output)

    transformed_ast.error.should.equal(false)
    transformed_ast.result.main.body.should.deepEqual([
      {
        type: 'assignment',
        left: { indextypes: [], type: Types.Integer},
        right: [{kind:'literal', type_info: Types.Integer}]
      },
      {
        type: 'assignment',
        left: {indextypes: [], type: Types.Integer},
        right: [{kind:'invocation', type_info:{indextypes: [], type: Types.Integer}}]
      },
      {
        type: 'assignment',
        left: {indextypes: [], type: Types.Integer},
        right: [{kind:'invocation', type_info:{indextypes: [], type: b_type}}]
      },
      {
        type: 'assignment',
        left: {indextypes: [], type: Types.Integer},
        right: [{kind:'invocation', type_info:{indextypes: [], type: c_type}}]
      },
      {
        type: 'assignment',
        left: {indextypes: [], type: Types.Integer},
        right: [{kind:'invocation', type_info:{indextypes: [], type: d_type}}]
      }
    ])
  })

  it('tipea dos modulos', () => {
    let code = `variables
      entero v[5], a
    inicio
      v[1] <- 5
      v[2] <- 8
      v[3] <- 7
      v[4] <- 9
      v[5] <- 3
      a <- sumar(2, 2)
    fin

    entero funcion sumar(entero a, entero b)
      entero a, b
    inicio
      retornar a + b
    finfuncion
    `

    let parser_output = programFromSource(code)

    let transform = compose(bind(Typer), bind(CallDecorator), Declarator)

    let transformed_ast = transform(parser_output)

    transformed_ast.error.should.equal(false)
  })

  it('error al intentar asignar a una variable inexistente', () => {
    let code = `variables
    inicio
      a <- 5
    fin`

    let parser_output = programFromSource(code)

    let transform = compose(bind(Typer), bind(CallDecorator), Declarator)

    let transformed_ast = transform(parser_output)

    transformed_ast.error.should.equal(true)
    transformed_ast.result.should.deepEqual([
      {reason:'undefined-variable', name:'a'}
    ])
  })

  it('error al usar demasiados indices sobre un arreglo', () => {
    let code = `variables
      entero v[3]
    inicio
      v[2, 1] <- 5
    fin`

    let parser_output = programFromSource(code)

    let transform = compose(bind(Typer), bind(CallDecorator), Declarator)

    let transformed_ast = transform(parser_output)

    transformed_ast.error.should.equal(true)
    transformed_ast.result.should.deepEqual([
      {reason:'@invocation-too-many-indexes', expected:1, received:2}
    ])
  })

  it('encontrar error dentro del cuerpo de una estructura', () => {
    let code = `variables
      entero v[3], i
    inicio
      i <- 0
      mientras (i < 10)
        v[2, 1] <- 5
        i <- 1 + 1
      finmientras
    fin`

    let parser_output = programFromSource(code)

    let transform = compose(bind(Typer), bind(CallDecorator), Declarator)

    let transformed_ast = transform(parser_output)

    transformed_ast.error.should.equal(true)
    transformed_ast.result.should.deepEqual([
      {reason:'@invocation-too-many-indexes', expected:1, received:2}
    ])
  })
})
