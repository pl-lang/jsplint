'use strict'
var should = require('should');

describe('InterpreterController', () => {
  let InterpreterController = require('../main.js')

  it('el pasaje de mensajes funciona bien', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let controller = new InterpreterController({event_logging:false})

    let program_finished = false

    controller.on('program-finished', () => {program_finished = true})

    console.log(controller.callbacks)

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
})
