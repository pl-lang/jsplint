/**
 * Aca van las pruebas de LinkedList
 */

'use strict'

const should = require('should');
const BranchingNode = require('../auxiliary/BranchingNode')
const LinkedList = require('../auxiliary/LinkedList')
const Node = require('../auxiliary/Node')

describe('LinkedList', () => {
  it('Los nodos guardan sus datos correctamente', () => {
    let node = new Node('i am a node')

    node.data.should.equal('i am a node')

    let flag = node.getNext() === null
    flag.should.equal(true)
  })

  it('Agregar un nodo a una lista', () => {
    let node = new Node(1)
    let list = new LinkedList()

    list.addNode(node)

    list.length.should.equal(1)
    list.firstNode.should.equal(list.lastNode)
  })

  it('Los datos de una lista se guardan bien', () => {
    let data = [1, 2, 3, 4]

    let list = new LinkedList()

    for (let item of data) {
      let node = new Node(item)

      list.addNode(node)
    }

    let current = list.firstNode
    let index = 0
    while (current !== null) {
      current.data.should.equal(data[index])
      index++
      current = current.getNext()
    }
  })
})

describe('BranchingNode', () => {
  it('Cuando a getNext se le pasa true devuelve el nodo "derecho"', () => {
    let leftNode = new Node('left')
    let rightNode = new Node('right')

    let branching = new BranchingNode()

    branching.leftBranchNode = leftNode
    branching.rightBranchNode = rightNode

    branching.getNext(true).should.equal(rightNode)
  })

  it('Cuando a getNext no se le pasa nada devuelve el nodo "izquierdo"', () => {
    let leftNode = new Node('left')
    let rightNode = new Node('right')

    let branching = new BranchingNode()

    branching.leftBranchNode = leftNode
    branching.rightBranchNode = rightNode

    branching.getNext().should.equal(leftNode)
  })
})
