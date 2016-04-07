'use strict'

import should from 'should'

import Parser from '../src/parser/Parser.js'

describe('Parser', () => {
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

  // parser.on('lexical-error', () => {
  //   lexical_error = true
  // })
  //
  // parser.on('syntax-error', () => {
  //   syntax_error = true
  // })

  parser.on('parsing-finished', () => {
    parsing_finished = true
  })

  let report =  parser.parse(code)

  report.error.should.equal(false)
  parsing_started.should.equal(true)
  parsing_finished.should.equal(true)
})
