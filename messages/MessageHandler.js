'use strict'
class MessageHandler {
  constructor(messageReceivedFunction) {
    this.listeners = new Set()

    // Some MessageHandlers may not receive messages and thus don't need
    // a messageReceived function
    if (messageReceivedFunction !== undefined) {
      this.messageReceived = messageReceivedFunction
    }
    else {
      this.messageReceived = null
    }
  }

  addMessageListener(listener) {
    this.listeners.add(listener)
  }

  removeMessageListener(listener) {
    this.listeners.delete(listener)
  }

  sendMessage(message) {
    for (let listener of this.listeners) {
      listener.messageReceived(message)
    }
  }
}

module.exports = MessageHandler
