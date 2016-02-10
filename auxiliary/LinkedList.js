'use strict'

class LinkedList {
  constructor() {
    this.length = 0
    this.firstNode = null
    this.lastNode = null
  }

  addNode(node) {
    if (this.length === 0) {
      this.firstNode = node
      this.lastNode = node
      this.length++
    } else {
      this.lastNode.next = node
      this.lastNode = node
      this.length++
    }
  }
}

module.exports = LinkedList
