'use strict'

import should from 'should'

import Parser from '../src/parser/Parser.js'

import Checkable from '../src/transformer/Checkable.js'

import Interpretable from '../src/transformer/Interpretable.js'

import { inspect } from 'util'

describe('Parser', () => {
  it('emite los eventos de inicio y fin para un programa sin errores', () => {
    let code = `variables
    inicio
    fin`

    let parsing_started = false
    let lexical_error = false
    let syntax_error = false
    let parsing_finished = false

    let parser = new Parser()

    parser.on('parsing-started', () => {
      parsing_started = true
    })

    parser.on('lexical-error', () => {
      lexical_error = true
    })

    parser.on('syntax-error', () => {
      syntax_error = true
    })

    parser.on('parsing-finished', () => {
      parsing_finished = true
    })

    let report =  parser.parse(code)

    report.error.should.equal(false)
    parsing_started.should.equal(true)
    lexical_error.should.equal(false)
    syntax_error.should.equal(false)
    parsing_finished.should.equal(true)
  })

  it('emite un evento de error lexico cuando se encuentra uno', () => {
    let code = `variables
    entero a
    inicio
    a <- 32 $ 2
    fin`

    let parsing_started = false
    let lexical_error = false
    let syntax_error = false
    let parsing_finished = false

    let parser = new Parser()

    let error_report

    parser.on('parsing-started', () => {
      parsing_started = true
    })

    parser.on('lexical-error', (error_info) => {
      lexical_error = true
      error_report = error_info
    })

    parser.on('syntax-error', () => {
      syntax_error = true
    })

    parser.on('parsing-finished', () => {
      parsing_finished = true
    })

    let report =  parser.parse(code)

    report.error.should.equal(true)
    parsing_started.should.equal(true)
    lexical_error.should.equal(true)
    report.result.should.deepEqual(error_report)
    syntax_error.should.equal(false)
    parsing_finished.should.equal(true)
  })

  it('lee un programa con funciones', () => {
    let code = `variables
    inicio
    fin

    entero funcion sumar(entero a, entero b)
      entero resultado
    inicio
      resultado <- a + b
      retornar resultado
    finfuncion

    entero funcion restar(entero a, entero b)
      entero resultado
    inicio
      resultado <- a - b
      retornar resultado
    finfuncion
    `

    let parser = new Parser()

    let report = parser.parse(code)

    report.error.should.equal(false)
    report.result.modules.length.should.equal(3)
    report.result.modules[0].name.should.equal('main')
    report.result.modules[1].name.should.equal('sumar')
    report.result.modules[2].name.should.equal('restar')
  })
})

describe('Checkable transformer', () => {
  it('transforma correctamente un modulo', () => {
    let code = `variables
    entero a, b
    inicio
    fin`

    let parser = new Parser()

    let report =  parser.parse(code)

    report.error.should.equal(false)

    let transformed_module = Checkable(report.result).modules[0]

    transformed_module.should.deepEqual({
      type:'module',
      name:'main',
      body:[],
      locals:{
        'a':{
          name:'a',
          type:'entero',
          isArray:false,
          dimension:null
        },
        b:{
          name:'b',
          type:'entero',
          isArray:false,
          dimension:null
        }
      }
    })
  })
})

describe('Interpretable', () => {
  it('prueba con un programa con un cuerpo vacio', () => {
    let code = `variables
    entero a, real b
    inicio
    fin`

    let parser = new Parser()

    let parsing_report =  parser.parse(code)

    parsing_report.error.should.equal(false)

    let transformed_program = Interpretable(Checkable(parsing_report.result))

    transformed_program.should.deepEqual(
      {
        modules : {
          main : {
            locals : {
              a : {
                name : 'a',
                isArray : false,
                dimension : null,
                type : 'entero'
              },
              b : {
                name : 'b',
                isArray : false,
                dimension : null,
                type : 'real'
              }
            },
            root : null
          }
        }
      }
    )
  })

  it('prueba con un programa con un enunciado de asignacion', () => {
    let code = `variables
    entero variable
    inicio
    variable <- 32
    fin`

    let parser = new Parser()

    let parsing_report =  parser.parse(code)

    parsing_report.error.should.equal(false)

    let transformed_program = Interpretable(Checkable(parsing_report.result))

    transformed_program.modules.main.root.data.should.deepEqual({
      action : 'assignment',
      target : {
        name:'variable',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload : {
        expression_type:'literal',
        type:'entero',
        value:32
      }
    })
  })

  it('prueba con un programa con un enunciado si..sino', () => {
    let code = `variables
    entero variable
    inicio
    si (verdadero) entonces
      variable <- 32
    sino
      variable <- 32
    finsi
    fin`

    let parser = new Parser()

    let parsing_report =  parser.parse(code)

    parsing_report.error.should.equal(false)

    let transformed_program = Interpretable(Checkable(parsing_report.result))

    transformed_program.modules.main.root.data.should.deepEqual({
      action:'if',
      condition:{expression_type:'literal', type:'logico', value:true}
    })

    transformed_program.modules.main.root.leftBranchNode.data.should.deepEqual({
      action:'assignment',
      target : {
        name:'variable',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload : {
        expression_type:'literal',
        type:'entero',
        value:32
      }
    })

    transformed_program.modules.main.root.rightBranchNode.data.should.deepEqual({
      action:'assignment',
      target : {
        name:'variable',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload : {
        expression_type:'literal',
        type:'entero',
        value:32
      }
    })
  })

  it('prueba para un programa con una estructura mientras', () => {
    let code = `variables
    entero variable
    inicio
    mientras (verdadero)
      variable <- 32
    finmientras
    fin`

    let parser = new Parser()

    let parsing_report =  parser.parse(code)

    parsing_report.error.should.equal(false)

    let transformed_program = Interpretable(Checkable(parsing_report.result))

    transformed_program.modules.main.root.data.should.deepEqual({
      action:'while',
      condition:{expression_type:'literal', type:'logico', value:true}
    })

    transformed_program.modules.main.root._loop_body_root.data.should.deepEqual({
      action:'assignment',
      target : {
        name:'variable',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload : {
        expression_type:'literal',
        type:'entero',
        value:32
      }
    })
  })

  it.skip('prueba para un programa con una estructura mientras', () => {
    let code = `variables
    entero variable
    inicio
    repetir
      variable <- 32
    hasta que (verdadero)
    fin`

    let parser = new Parser()

    let parsing_report =  parser.parse(code)

    parsing_report.error.should.equal(false)

    let transformed_program = Interpretable(Checkable(parsing_report.result))

    transformed_program.modules.main.root.data.should.deepEqual({
      action:'until',
      condition:{expression_type:'literal', type:'logico', value:true}
    })

    transformed_program.modules.main.root.loop_body_root.data.should.deepEqual({
      action:'assignment',
      target : {
        name:'variable',
        isArray:false,
        indexes:null,
        bounds_checked:false
      },
      payload : {
        expression_type:'literal',
        type:'entero',
        value:32
      }
    })
  })
})
