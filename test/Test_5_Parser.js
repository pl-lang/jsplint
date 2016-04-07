'use strict'

import should from 'should'

import Parser from '../src/parser/Parser.js'

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
