'use strict'
import should from 'should'
import fs from 'fs'

import * as Types from '../src/typechecker/Types.js'
import * as TC from '../src/typechecker/TypeChecker.js'

describe('Comparar tipos', () => {
  it('Integer == Integer', () => {
    TC.equals(Types.Integer, Types.Integer).should.equal(true)
  })

  it('Integer != Float', () => {
    TC.equals(Types.Integer, Types.Float).should.equal(false)
  })
})

describe('calculate type', () => {
  it('expresion logica', () => {
    let exp = [ {kind:'type', type:Types.Bool}, {kind:'operator', name:'not'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Bool)
  })

  it('comparasion de entero con real', () => {
    let exp = [ {kind:'type', type:Types.Integer}, {kind:'type', type:Types.Float}, {kind:'operator', name:'equal'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Bool)
  })

  it('suma de entero con real', () => {
    let exp = [ {kind:'type', type:Types.Integer}, {kind:'type', type:Types.Float}, {kind:'operator', name:'plus'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Float)
  })

  it('suma de entero con entero', () => {
    let exp = [ {kind:'type', type:Types.Integer}, {kind:'type', type:Types.Integer}, {kind:'operator', name:'plus'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Integer)
  })

  it('division', () => {
    {
      let exp = [ {kind:'type', type:Types.Integer}, {kind:'type', type:Types.Integer}, {kind:'operator', name:'divide'} ]

      let report = TC.calculate_type(exp)
      report.error.should.equal(false)
      report.result.should.equal(Types.Float)
    }

    {
      let exp = [ {kind:'type', type:Types.Float}, {kind:'type', type:Types.Float}, {kind:'operator', name:'divide'} ]

      let report = TC.calculate_type(exp)
      report.error.should.equal(false)
      report.result.should.equal(Types.Float)
    }
  })

  it('binary_logic_operators', () => {
    let exp = [ {kind:'type', type:Types.Bool}, {kind:'type', type:Types.Bool}, {kind:'operator', name:'and'} ]

    let report = TC.calculate_type(exp)
    report.error.should.equal(false)
    report.result.should.equal(Types.Bool)
  })
})

describe('assignment rule', () => {
  it('asignar un valor entero a una variable entera', () => {
    let assignment = {
      left: Types.Integer,
      right: [{kind:'type', type:Types.Integer}]
    }

    let report = TC.assignment_rule(assignment)

    report.error.should.equal(false)
  })
})

describe('call rule', () => {
  it('verificar una llamada correcta', () => {
    let call = {
      args:[[{kind:'type', type:Types.Integer}], [{kind:'type', type:Types.Float}]],
      argtypes: [Types.Integer, Types.Float],
      return_type: Types.Integer
    }

    let report = TC.call_rule(call)

    report.error.should.equal(false)
    report.result.should.deepEqual(Types.Integer)
  })
})
