'use strict'

import should from 'should'

import Compiler from '../src/parser/Compiler.js'

describe('Compiler', () => {
  it('Un programa correcto se compila sin errores', () => {
    let code = `
    variables
      entero a
    inicio
      a <- 2
    fin
    `

    let compilation_started = false, compilation_finished = false
    let type_check_started = false, type_check_finished = false

    let compiler = new Compiler({event_logging:false})

    compiler.on('compilation-started', () => {
      compilation_started = true
    })
    compiler.on('compilation-finished', () => {
      compilation_finished = true
    })
    compiler.on('type-check-started', () => {
      type_check_started = true
    })
    compiler.on('type-check-finished', () => {
      type_check_finished = true
    })

    const RUN_TYPE_CHECKER = true

    let report = compiler.compile(code, RUN_TYPE_CHECKER)

    report.error.should.equal(false)
    compilation_started.should.equal(true)
    compilation_finished.should.equal(true)
    type_check_started.should.equal(true)
    type_check_finished.should.equal(true)
  })

  it.skip('los errores lexicos emiten eventos y detienen la compilacion', () => {})
})