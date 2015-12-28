'use strict'
var should = require('should');

describe('InterpreterController', () => {
  let InterpreterController = require('../main.js')
  let MessageHandler        = require('../messages/MessageHandler')

  it('el pasaje de mensajes funciona bien', () => {
    let programa = 'variables\nentero a, b\ninicio\na<-48\nb <- 32\nfin\n'
    let controller = new InterpreterController(programa)

    let msn = new MessageHandler((message) => {
      if (message.subject == 'scan-end') {
        true.should.equal(true)
      }
    })

    controller.addMessageListener(msn)
    msn.addMessageListener(controller)

    msn.sendMessage({subject:'run'})
  })

  it('las llamadas a escribir funcionan bien', () => {
    let programa = 'variables\ninicio\nescribir(42, 28)\nfin\n'
    let controller = new InterpreterController(programa)

    let variable;

    let msn = new MessageHandler((message) => {
      if (message.subject == 'scan-end') {
        true.should.equal(true)
      }
      else if (message.subject == 'escribir') {
        variable = message.things_to_print
      }
    })

    controller.addMessageListener(msn)
    msn.addMessageListener(controller)

    msn.sendMessage({subject:'run'})

    variable.should.deepEqual([42, 28])
  })
})
