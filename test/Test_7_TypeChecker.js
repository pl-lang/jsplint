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

  it('bucle para correcto', () => {
    let code = `variables
      entero i
    inicio
      para i <- 1 hasta 10
      finpara
    fin`

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([])
  })
})

describe('Programas que deberian devolver errores', () => {
  it('tipo de retorno distinto al declarado', () => {
    let code = `variables
      entero a
    inicio
      a <- sumar(2, 3)
    fin

    entero funcion sumar(entero a, entero b)
      entero a, b
    inicio
      retornar 2.78
    finfuncion
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([
      {
        reason: '@function-bad-return-type',
        expected: 'entero',
        returned: 'real'
      }
    ])
  })

  it('asignar real a variable de tipo entero', () => {
    let code = `variables
      entero a
    inicio
      a <- 2.36
    fin
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([
      {
        reason: 'assignment-error',
        errors: [
          {reason: '@assignment-incompatible-types', expected: 'entero', received: 'real'}
        ]
      }
    ])
  })

  it('asignar entero a variable de tipo logico', () => {
    let code = `variables
      logico a
    inicio
      a <- 2
    fin
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([
      {
        reason: 'assignment-error',
        errors: [
          {reason: '@assignment-incompatible-types', expected: 'logico', received: 'entero'}
        ]
      }
    ])
  })

  it('llamar funcion con menos o mas argumentos de los necesarios', () => {
    let code = `variables
      entero a
    inicio
      a <- sumar(2)
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

    check_result.should.deepEqual([
      {
        reason: 'assignment-error',
        errors: [
          {
            reason: '@call-errors-found',
            name: 'sumar',
            errors: [
              {reason: '@call-incorrect-arg-number', expected: 2, received: 1}
            ]
          }
        ]
      }
    ])
  })

  it('llamar funcion con argumentos del tipo equivocado', () => {
    let code = `variables
      entero a
    inicio
      a <- sumar(2.89, 4.6)
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

    check_result.should.deepEqual([
      {
        reason: 'assignment-error',
        errors: [
          {
            reason: '@call-errors-found',
            name: 'sumar',
            errors: [
              {reason: '@call-wrong-argument-type', expected: 'entero', received: 'real', at: 1},
              {reason: '@call-wrong-argument-type', expected: 'entero', received: 'real', at: 2}
            ]
          }
        ]
      }
    ])
  })

  it.skip('invocar arreglo con un indice de tipo real', () => {
    let code = `variables
      entero m[5, 3]
    inicio
      m[2.78, verdadero] <- 2
    fin
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([
      {
        reason: 'non-integer-index',
        bad_type: 'real',
        at: 1
      }
    ])
  })

  it('condicionar una estructura con un valor entero', () => {
    let code = `variables
      entero a
    inicio
      si (2) entonces
        a <- 3
      finsi
    fin
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([
      {
        reason: '@condition-invalid-expression',
        received: 'entero'
      }
    ])
  })

  it('llamar a escribir con un valor "escribible"', () => {
    let code = `variables
      entero v[2, 2, 3]
    inicio
      escribir(v)
    fin
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([{
      reason: '@io-errors-found',
      name: 'escribir',
      errors: [{reason: '@io-wrong-argument-type', at: 1, received: 'entero[2, 2, 3]'}]
    }])
  })

  it('llamar a escribir con un valor no "escribible"', () => {
    let code = `variables
      entero v[2, 2, 3]
    inicio
      escribir(v)
    fin
    `

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([{
      reason: '@io-errors-found',
      name: 'escribir',
      errors: [{reason: '@io-wrong-argument-type', at: 1, received: 'entero[2, 2, 3]'}]
    }])
  })

  it('bucle para correcto', () => {
    let code = `variables
      real i
    inicio
      para i <- 2.6 hasta verdadero
      finpara
    fin`

    let parser_output = parse(code)

    let transformed_ast = bind(Typer, bind(CallDecorator, Declarator(parser_output)))

    let check_result = bind(TC.check, transformed_ast)

    check_result.should.deepEqual([
      [
        {
          reason: '@for-non-integer-counter',
          received: 'real'
        },
        {
          reason: '@for-non-integer-init',
          received: 'real'
        },
        {
          reason: '@for-non-integer-goal',
          received: 'logico'
        }
      ]
    ])
  })
})
