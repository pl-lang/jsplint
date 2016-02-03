'use strict'
var should = require('should');

describe('InterpreterController', () => {
  let InterpreterController = require('../main.js')

  it('el pasaje de mensajes funciona bien', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let controller = new InterpreterController({event_logging:false})

    let program_finished = false

    controller.on('program-finished', () => {program_finished = true})

    controller.run(programa)

    program_finished.should.equal(true)

  })

  it('las llamadas a escribir funcionan bien', () => {
    let programa = 'variables\ninicio\nescribir(42, 28)\nfin\n'
    let controller = new InterpreterController({event_logging:false})

    let flag = false;

    controller.on('write', () => {flag = true})

    controller.run(programa)

    flag.should.equal(true)
  })

  it('los errores lexicos emiten eventos y detienen la compilacion', () => {
    let programa = 'variables\ninicio\nescribir(4.A2, 28)\nfin\n'
    let controller = new InterpreterController({event_logging:false})

    let lexicalErrorEmitted = false
    let compilationStarted = false
    let compilationFinishedWithErrors = false

    controller.on('compilation-started', (event) => {compilationStarted = true})

    controller.on('lexical-error', () => {lexicalErrorEmitted = true})

    controller.on('compilation-finished', (event, report) => {compilationFinishedWithErrors = true})

    controller.run(programa)

    lexicalErrorEmitted.should.equal(true)
    compilationStarted.should.equal(true)
    compilationFinishedWithErrors.should.equal(true)

    // TODO: verificar que el programa no se ejecute
  })

  it.skip('la compilacion finaliza y el programa no se ejecuta cuando hay un error de sintaxis', () => {

  })
})
