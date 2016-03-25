'use strict'

function getLastNode(node) {
  if (node.getNextStatementNode() === null) {
    return node
  }
  else {
    let current = node
    while (current !== null) {
      if (current.getNextStatementNode() === null) {
        return current
      }
      else {
        current = current.getNextStatementNode()
      }
    }
  }
}

function getChainLenght(node) {
  let lenght = 0
  let current = node
  while (current !== null) {
    lenght++
    current = current.getNext()
  }
  return lenght
}

class LinkedList {
  constructor() {
    this.length = 0
    this.firstNode = null
    this.lastNode = null
  }

  addNode(node) {
    if (this.firstNode === null) {
      this.firstNode = node
      this.lastNode = node
    }
    else {
      this.lastNode.setNext(node)
      this.lastNode = getLastNode(node)
    }
  }
}

module.exports = {
  LinkedList:LinkedList,
  getChainLenght:getChainLenght,
  getLastNode:getLastNode
}
