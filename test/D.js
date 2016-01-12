'use strict'
var should = require('should');

describe('InterpreterController', () => {
  let InterpreterController = require('../main.js')

  it('el pasaje de mensajes funciona bien', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let controller = new InterpreterController({event_logging:true})

    let program_finished = false

    controller.on('program-finished', () => {program_finished = true})

    console.log(controller.callbacks)

    controller.run(programa)

    program_finished.should.equal(true)

  })

  it('las llamadas a escribir funcionan bien', () => {
    let programa = 'variables\ninicio\nescribir(42, 28)\nfin\n'
    let controller = new InterpreterController()

    let variable;

    let msn = new MessageHandler((message) => {
      if (message.subject == 'scan-end') {
        true.should.equal(true)
      }
      else if (message.subject == 'escribir') {
        variable = message.things_to_print
      }
      else if (message.subject == 'correct-syntax') {
        controller.setUpInterpreter(message.body)
        controller.run()
      }
    })

    controller.addMessageListener(msn)
    msn.addMessageListener(controller)

    controller.scan(programa)

    variable.should.deepEqual([42, 28])
  })
})
