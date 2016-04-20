'use strict'

import should from 'should'

import Parser from '../src/parser/Parser.js'

import Checkable from '../src/transformer/Checkable.js'

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

    let transformation_report = Checkable(report.result)

    transformation_report.error.should.equal(false)

    let module = transformation_report.result.modules[0]

    module.should.deepEqual({
      type:'module',
      name:'main',
      body:[],
      locals:{
        'a':{
          name:'a',
          type:'entero',
          isArray:false,
          dimension:null,
          bounds_checked:false
        },
        b:{
          name:'b',
          type:'entero',
          isArray:false,
          dimension:null,
          bounds_checked:false
        }
      }
    })
  })

  it('detecta variables repetidas', () => {
    let code = `variables
    entero a, real a
    inicio
    fin`

    let parser = new Parser()

    let report =  parser.parse(code)

    report.error.should.equal(false)

    let transformation_report = Checkable(report.result)

    transformation_report.error.should.equal(true)

    let repeated_pairs = transformation_report.result

    repeated_pairs.should.deepEqual([
      [
        {
          first:{
            name:'a',
            type:'entero',
            isArray:false,
            dimension:null
          },
          second:{
            name:'a',
            type:'real',
            isArray:false,
            dimension:null
          }
        }
      ]
    ])
  })
})

describe.skip('Interpretable', () => {
  it('prueba...', () => {
    let code = `variables
    entero a, real a
    inicio
    fin`

    let parser = new Parser()

    let parsing_report =  parser.parse(code)

    parsing_report.error.should.equal(false)

    let modules_report = parsing_report.result.modules.map(Checkable)


  })
})
