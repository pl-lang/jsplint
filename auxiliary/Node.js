'use strict'

class Node {
  constructor(data) {
    if (data) {
      this.data = data
    } else {
      this.data = null
    }

    this._next = null;
  }

  setNext(nextNode) {
    this._next = nextNode
  }

  getNext() {
    return this._next
  }

  getNextStatementNode() {
    return this.getNext()
  }
}

module.exports = Node
