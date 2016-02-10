'use strict'

class Node {
  constructor(data) {
    if (data) {
      this.data = data
    }

    this.next = null;
  }
}

module.exports = Node
