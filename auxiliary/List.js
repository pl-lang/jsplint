'use strict'

function getLastNode(node) {
  if (node.next === null) {
    return node
  }
  else {
    let current = node
    while (current !== null) {
      if (current.getNext() === null) {
        return current
      }
      else {
        current = current.getNext()
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
    if (this.length == 0) {
      this.firstNode = node
      this.lastNode = node
      this.length++
    } else {
      this.lastNode.setNext(node)
      this.lastNode = node
      this.length++
    }
  }
}

module.exports = {
  LinkedList:LinkedList,
  getChainLenght:getChainLenght,
  getLastNode:getLastNode
}
