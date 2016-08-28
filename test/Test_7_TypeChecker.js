'use strict'
import should from 'should'
import fs from 'fs'

import {bind} from '../src/utility/helpers.js'

import Parser from '../src/parser/Parser.js'

import * as Types from '../src/typechecker/Types.js'

import Declarator from '../src/transformer/Declarator.js'
import Typer from '../src/transformer/Typer.js'

import * as TC from '../src/typechecker/TypeChecker.js'

function parse(string) {
  let parser = new Parser()

  let parser_output = parser.parse(string).result

  return parser_output
}


describe('Comparar tipos', () => {
  it('Integer == Integer', () => {
    TC.equals(Types.Integer, Types.Integer).should.equal(true)
  })

  it('Integer != Float', () => {
    TC.equals(Types.Integer, Types.Float).should.equal(false)
  })

  it('Integer != Array<3, Integer>', () => {
    TC.equals(Types.Integer, new Types.ArrayType(Types.Integer, 3)).should.equal(false)
  })

  it('Array<3, Integer> == Array<3, Integer>', () => {
    TC.equals(new Types.ArrayType(Types.Integer, 3), new Types.ArrayType(Types.Integer, 3)).should.equal(true)
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

describe('call rule', () => {
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
  it('programa solo con modulo principal', () => {
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
})
