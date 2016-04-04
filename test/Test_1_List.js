'use strict'

import should from 'should'

import { LinkedList, getChainLenght, getLastNode } from '../misc/List.js'

import Node from '../misc/Node.js'
import BranchingNode from '../misc/BranchingNode.js'
import WhileNode from '../misc/WhileNode.js'
import IfNode from '../misc/IfNode.js'

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

  it('Cuando solo existe la rama verdadera, el nodo de la rama izquierda es el que le sigue al bloque if', () => {
    let rightNode = new Node('right')

    let testNode = new Node('test')

    let ifNode = new IfNode()

    ifNode.rightBranchNode = rightNode

    ifNode.setNext(testNode)

    ifNode.leftBranchNode.should.equal(testNode)
  })

  it('setCurrentBranchTo cambia el nodo que getNext devuelve', () => {
    let rightNode = new Node('right')
    let leftNode = new Node('left')
    let next = new Node('next')

    let ifNode = new IfNode()

    ifNode.rightBranchNode = rightNode
    ifNode.leftBranchNode = leftNode
    ifNode.setNext(next)

    ifNode.setCurrentBranchTo('false_branch')

    ifNode.getNext().should.equal(leftNode)

    ifNode.setCurrentBranchTo('true_branch')

    ifNode.getNext().should.equal(rightNode)

    ifNode.setCurrentBranchTo('next_statement')

    ifNode.getNext().should.equal(next)
  })
})

describe('WhileNode', () => {
  it('Al llamar a getNext (por defecto) se entra al bucle', () => {
    let while_node = new WhileNode()

    let body_root = new Node('test')

    let other_node = new Node('asdasd')

    while_node.loop_body_root = body_root

    while_node.setNext(other_node)

    while_node.getNext().should.equal(body_root)
  })

  it('El ultimo nodo del bucle apunta al nodo de la condicion de entrada', () => {
    let while_node = new WhileNode()

    let body_root = new Node('test')

    let other_node = new Node('asdasd')

    while_node.loop_body_root = body_root

    while_node.setNext(other_node)

    body_root.getNext().should.equal(while_node)
  })

  it('con setCurrentBranchTo se puede cambiar el nodo que le "sigue" a un WhileNode', () => {
    let while_node = new WhileNode()

    let body_root = new Node('body_root')

    let other_node = new Node('next statement node')

    while_node.loop_body_root = body_root

    while_node.setNext(other_node)

    while_node.setCurrentBranchTo('program_body')

    while_node.getNext().should.equal(other_node)

    while_node.setCurrentBranchTo('loop_body')

    while_node.getNext().should.equal(body_root)
  })
})
