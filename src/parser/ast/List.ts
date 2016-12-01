'use strict'

export interface Node<A> {
  data: A
  getNext: ()=>Node<A>
  setNext: (n: Node<A>)=>void
  getNextStatementNode: ()=>Node<A>
}

export function getLastNode <A>(node: Node<A>) : Node<A> {
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

export function getChainLenght <A>(node: Node<A>) : number {
  let lenght = 0
  let current = node
  while (current !== null) {
    lenght++
    current = current.getNext()
  }
  return lenght
}

export class LinkedList<A> {
  length: number
  first: Node<A>
  last: Node<A>

  constructor (nodes?: Node<A>) {
    if (nodes) {
      this.length = getChainLenght(nodes)
      this.first = nodes
      this.last = getLastNode(nodes)
    }
    else {
      this.length = 0
      this.first = null
      this.last = null
    }
  }

  addNode (node: Node<A>) {
    if (this.first === null) {
      this.first = node
      this.last = getLastNode(node)
      this.length += getChainLenght(node)
    }
    else {
      this.last.setNext(node)
      this.last = getLastNode(node)
      this.length += getChainLenght(node)
    }
  }
}
