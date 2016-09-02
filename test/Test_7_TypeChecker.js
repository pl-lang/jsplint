'use strict'
import should from 'should'
import fs from 'fs'

import {bind} from '../src/utility/helpers.js'

import Parser from '../src/parser/Parser.js'

import CallDecorator from '../src/transformer/CallDecorator.js'
import Declarator from '../src/transformer/Declarator.js'
import Typer from '../src/transformer/Typer.js'

import * as Types from '../src/typechecker/Types.js'
import * as TC from '../src/typechecker/TypeChecker.js'

function parse(string) {
  let parser = new Parser()

  let parser_output = parser.parse(string).result

  return parser_output
}


describe('Comparar tipos', () => {
  it('Integer == Integer', () => {
    Types.equals(Types.Integer, Types.Integer).should.equal(true)
  })

  it('Integer != Float', () => {
    Types.equals(Types.Integer, Types.Float).should.equal(false)
  })

  it('Integer != Array<3, Integer>', () => {
    Types.equals(Types.Integer, new Types.ArrayType(Types.Integer, 3)).should.equal(false)
  })

  it('Array<3, Integer> == Array<3, Integer>', () => {
    Types.equals(new Types.ArrayType(Types.Integer, 3), new Types.ArrayType(Types.Integer, 3)).should.equal(true)
  })
})

describe('calculate type', () => {
  it('expresion logica', () => {
    let exp = [ {kind:'type', type_info:Types.Bool}, {kind:'operator', name:'not'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Bool)
  })

  it('comparasion de entero con real', () => {
    let exp = [ {kind:'type', type_info:Types.Integer}, {kind:'type', type_info:Types.Float}, {kind:'operator', name:'equal'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Bool)
  })

  it('suma de entero con real', () => {
    let exp = [ {kind:'type', type_info:Types.Integer}, {kind:'type', type_info:Types.Float}, {kind:'operator', name:'plus'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Float)
  })

  it('suma de entero con entero', () => {
    let exp = [ {kind:'type', type_info:Types.Integer}, {kind:'type', type_info:Types.Integer}, {kind:'operator', name:'plus'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Integer)
  })

  it('division', () => {
    {
      let exp = [ {kind:'type', type_info:Types.Integer}, {kind:'type', type_info:Types.Integer}, {kind:'operator', name:'divide'} ]

      let report = TC.calculate_type(exp)
      report.error.should.equal(false)
      report.result.should.equal(Types.Float)
    }

    {
      let exp = [ {kind:'type', type_info:Types.Float}, {kind:'type', type_info:Types.Float}, {kind:'operator', name:'divide'} ]

      let report = TC.calculate_type(exp)
      report.error.should.equal(false)
      report.result.should.equal(Types.Float)
    }
  })

  it('binary_logic_operators', () => {
    let exp = [ {kind:'type', type_info:Types.Bool}, {kind:'type', type_info:Types.Bool}, {kind:'operator', name:'and'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Bool)
  })
})

describe('invocation rule', () => {
  it('good invocation', () => {
    let invocation = {
      type:Types.Integer,
      indextypes:[[{kind:'type', type_info:Types.Integer}], [{kind:'type', type_info:Types.Integer}]]
    }

    let report = TC.invocation_rule(invocation)

    report.error.should.equal(false)
    report.result.should.deepEqual(Types.Integer)
  })

  it('bad invocation', () => {
    let invocation = {
      type:Types.Integer,
      indextypes:[[{kind:'type', type_info:Types.Integer}], [{kind:'type', type_info:Types.Float}]]
    }

    let report = TC.invocation_rule(invocation)

    report.error.should.equal(true)
  })
})

describe('assignment rule', () => {
  it('asignar un valor entero a una variable entera', () => {
    let invocation = {
      type:Types.Integer,
      indextypes:[[{kind:'type', type_info:Types.Integer}], [{kind:'type', type_info:Types.Integer}]]
    }

    let assignment = {
      left: invocation,
      right: [{kind:'type', type_info:Types.Integer}]
    }

    let report = TC.assignment_rule(assignment)

    report.error.should.equal(false)
  })
})

describe.skip('call rule', () => {
  it('verificar una llamada correcta', () => {
    let call = {
      args:[[{kind:'type', type_info:Types.Integer}], [{kind:'type', type_info:Types.Float}]],
      argtypes: [Types.Integer, Types.Float],
      return_type: Types.Integer
    }

    let report = TC.call_rule(call)

    report.error.should.equal(false)
    report.result.should.deepEqual(Types.Integer)
  })
})

describe('Integracion con Typer', () => {
  it('asignacion a una variable', () => {
    let code = `variables
      entero a
    inicio
      a <- 2
    fin
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, Declarator(parser_output))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([])
  })

  it('asignar a las celdas de un vector ', () => {
    let code = `variables
      entero v[5]
    inicio
      v[1] <- 5
      v[2] <- 8
      v[3] <- 7
      v[4] <- 9
      v[5] <- 3
    fin`

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, Declarator(parser_output))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([])
  })

  it('asignacion a las celda de una matriz', () => {
    let code = `variables
      entero m[2, 2]
    inicio
      m[1, 1] <- 5
      m[1, 2] <- 8
      m[2, 1] <- 7
      m[2, 2] <- 9
    fin`

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, Declarator(parser_output))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([])
  })

  it('asignar vector a fila de matriz', () => {
    let code = `variables
      entero m[2, 2], v[2]
    inicio
      m[1] <- v
      m[2] <- m[1]
    fin`

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, Declarator(parser_output))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([])
  })

  it('asignar a una "cadena"', () => {
    let code = `variables
      caracter cadena[4]
    inicio
      cadena <- "hola"
    fin`

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, Declarator(parser_output))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([])
  })

  it('asignar retorno de funcion', () => {
    let code = `variables
      entero a
    inicio
      a <- sumar(2, 3)
    fin

    entero funcion sumar(entero a, entero b)
      entero a, b
    inicio
      retornar a + b
    finfuncion
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([])
  })
})
