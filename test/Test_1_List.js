'use strict'

import should from 'should'

import { LinkedList, getChainLenght, getLastNode } from '../src/parser/ast/List.js'
import { GenericNode, WhileNode, IfNode } from '../src/parser/ast/Nodes.js'

describe("Metodos auxiliares de listas", () => {
  it('getChainLenght funciona bien', () => {
    let nodeA = new GenericNode('a')
    let nodeB = new GenericNode('b')
    let nodeC = new GenericNode('c')

    nodeA.setNext(nodeB)
    nodeB.setNext(nodeC)

    getChainLenght(nodeA).should.equal(3)
  })

  it('getLastNode funciona bien', () => {
    let nodeA = new GenericNode('a')
    let nodeB = new GenericNode('b')
    let nodeC = new GenericNode('c')

    nodeA.setNext(nodeB)
    nodeB.setNext(nodeC)

    getLastNode(nodeA).data.should.equal('c')
  })
})

describe('LinkedList', () => {
  it('Los nodos guardan sus datos correctamente', () => {
    let node = new GenericNode('i am a node')

    node.data.should.equal('i am a node')

    let flag = node.getNext() === null
    flag.should.equal(true)
  })

  it('Agregar un nodo a una lista', () => {
    let node = new GenericNode(1)
    let list = new LinkedList()

    list.addNode(node)

    list.firstNode.should.equal(list.lastNode)
  })

  it('Los datos de una lista se guardan bien', () => {
    let data = [1, 2, 3, 4]

    let list = new LinkedList()

    for (let item of data) {
      let node = new GenericNode(item)

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

describe('IfNode', () => {
  it('Ambas raman "convergen" en el mismo nodo', () => {
    let leftNode = new GenericNode('left')
    let rightNode = new GenericNode('right')

    let testNode = new GenericNode('test')

    let ifNode = new IfNode()

    ifNode.false_branch_root = leftNode
    ifNode.true_branch_root = rightNode

    ifNode.setNext(testNode)

    console.log(ifNode.false_branch_root.getNext())

    ifNode.false_branch_root.getNext().should.equal(testNode)
    ifNode.true_branch_root.getNext().should.equal(testNode)
  })

  it('Cuando solo existe la rama verdadera, el nodo de la rama izquierda es el que le sigue al bloque if', () => {
    let rightNode = new GenericNode('right')

    let testNode = new GenericNode('test')

    let ifNode = new IfNode()

    ifNode.true_branch_root = rightNode

    ifNode.setNext(testNode)

    ifNode.false_branch_root.should.equal(testNode)
  })

  it('setCurrentBranchTo cambia el nodo que getNext devuelve', () => {
    let rightNode = new GenericNode('right')
    let leftNode = new GenericNode('left')
    let next = new GenericNode('next')

    let ifNode = new IfNode()

    ifNode.true_branch_root = rightNode
    ifNode.false_branch_root = leftNode
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

    let body_root = new GenericNode('test')

    let other_node = new GenericNode('asdasd')

    while_node.loop_body_root = body_root

    while_node.setNext(other_node)

    while_node.getNext().should.equal(body_root)
  })

  it('El ultimo nodo del bucle apunta al nodo de la condicion de entrada', () => {
    let while_node = new WhileNode()

    let body_root = new GenericNode('test')

    let other_node = new GenericNode('asdasd')

    while_node.loop_body_root = body_root

    while_node.setNext(other_node)

    body_root.getNext().should.equal(while_node)
  })

  it('con setCurrentBranchTo se puede cambiar el nodo que le "sigue" a un WhileNode', () => {
    let while_node = new WhileNode()

    let body_root = new GenericNode('body_root')

    let other_node = new GenericNode('next statement node')

    while_node.loop_body_root = body_root

    while_node.setNext(other_node)

    while_node.setCurrentBranchTo('program_body')

    while_node.getNext().should.equal(other_node)

    while_node.setCurrentBranchTo('loop_body')

    while_node.getNext().should.equal(body_root)
  })
})
