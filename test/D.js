'use strict'
var should = require('should');

describe('InterpreterController', () => {
  let InterpreterController = require('../main.js')
  let MessageHandler        = require('../messages/MessageHandler')

  it('el pasaje de mensajes funciona bien', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let controller = new InterpreterController()

    let msn = new MessageHandler((message) => {
      if (message.subject == 'scan-finished') {
        true.should.equal(true)
      }
      else if (message.subject == 'correct-syntax') {
        controller.run(message.body)
      }
    })

    controller.addMessageListener(msn)
    msn.addMessageListener(controller)

    controller.scan(programa)
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
        controller.run(message.body)
      }
    })

    controller.addMessageListener(msn)
    msn.addMessageListener(controller)

    controller.scan(programa)

    variable.should.deepEqual([42, 28])
  })
})
