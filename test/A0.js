/**
 * Aca van las pruebas de LinkedList
 */

'use strict'

const should = require('should');
const BranchingNode = require('../auxiliary/BranchingNode')
const LinkedList = require('../auxiliary/List').LinkedList
const getChainLenght = require('../auxiliary/List').getChainLenght
const getLastNode = require('../auxiliary/List').getLastNode
const Node = require('../auxiliary/Node')

describe("Metodos auxiliares de listas", () => {
  it('getChainLenght funciona bien', () => {
    let nodeA = new Node('a')
    let nodeB = new Node('b')
    let nodeC = new Node('c')

    nodeA.setNext(nodeB)
    nodeB.setNext(nodeC)

    getChainLenght(nodeA).should.equal(3)
  })

  it('getLastNode funciona bien', () => {
    let nodeA = new Node('a')
    let nodeB = new Node('b')
    let nodeC = new Node('c')

    nodeA.setNext(nodeB)
    nodeB.setNext(nodeC)

    getLastNode(nodeA).data.should.equal('c')
  })
})

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

  it('Agregar una cadena de nodos a una lista vacia', () => {
    let list = new LinkedList()

    let nodeA = new Node('a')
    let nodeB = new Node('b')
    let nodeC = new Node('c')

    nodeA.setNext(nodeB)
    nodeB.setNext(nodeC)

    list.addNode(nodeA)

    list.length.should.equal(3)
    list.firstNode.should.equal(nodeA)
    list.lastNode.should.equal(nodeC)
  })

  it('Agregar una cadena de nodos a una lista con un nodo', () => {
    let list = new LinkedList()

    let node = new Node(1)
    list.addNode(node)

    let nodeA = new Node('a')
    let nodeB = new Node('b')
    let nodeC = new Node('c')

    nodeA.setNext(nodeB)
    nodeB.setNext(nodeC)

    list.addNode(nodeA)

    list.length.should.equal(4)
    list.firstNode.should.equal(node)
    list.firstNode.getNext().should.equal(nodeA)
    list.lastNode.should.equal(nodeC)
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

  it('Cuando a getNext no se le pasa nada (o false) devuelve el nodo "izquierdo"', () => {
    let leftNode = new Node('left')
    let rightNode = new Node('right')

    let branching = new BranchingNode()

    branching.leftBranchNode = leftNode
    branching.rightBranchNode = rightNode

    branching.getNext().should.equal(leftNode)
    branching.getNext(false).should.equal(leftNode)
  })
})

describe('IfNode', () => {
  const IfNode = require('../auxiliary/IfNode')
  it('Ambas raman "convergen" en el mismo nodo', () => {
    let leftNode = new Node('left')
    let rightNode = new Node('right')

    let testNode = new Node('test')

    let ifNode = new IfNode()

    ifNode.leftBranchNode = leftNode
    ifNode.rightBranchNode = rightNode

    ifNode.setNext(testNode)

    ifNode.leftBranchNode.getNext().should.equal(testNode)
    ifNode.rightBranchNode.getNext().should.equal(testNode)
  })
})
