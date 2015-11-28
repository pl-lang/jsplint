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
    msn.addMessageListener(controller.message_handler)

    msn.sendMessage({subject:'run'})
  })
})
