'use strict'

const getLastNode = require('./List').getLastNode

/**
 * Este nodo va a ser utilizado para representar una if [else]
 * Al igual que BranchingNode, este nodo tiene dos ramas y devuelve una de las
 * dos en funcion del parametro que se le pase a getNext(). La diferencia esta
 * en que cuando se le asigna el nodo siguiente (con setNext), esa asignacion
 * se aplica al ultimo nodo de ambas ramas. En otras palabras, tanto la rama
 * verdadera como la falsa convergen en el mismo nodo cuando finalizan
 *
 * 					*
 * 				/  \
 * 			---  ---
 * 			---  ---
 * 			 \   /
 * 			 -----
 * 			 -----
 */
class IfNode {
  constructor(data) {
    if (data) {
      this.data = data
    } else {
      this.data = null
    }

    this.leftBranchNode = null
    this.rightBranchNode = null

    this.next_statement_node = null
  }

  setNext(node) {
    if (this.leftBranchNode === null) {
      this.leftBranchNode = node
    }
    else {
      let lastLeft = getLastNode(this.leftBranchNode)
      lastLeft.setNext(node)
    }

    if (this.rightBranchNode === null) {
      this.rightBranchNode = node
    }
    else {
      let lastRight = getLastNode(this.rightBranchNode)
      lastRight.setNext(node)
    }

    this.next_statement_node = node
  }

  setCurrentBranchTo(branch_name) {
    if (branch_name === 'true_branch') {
      this.returnedNode = this.rightBranchNode
    }
    else if (branch_name === 'false_branch') {
      this.returnedNode = this.leftBranchNode
    }
    else if (branch_name === 'next_statement') {
      this.returnedNode = this.next_statement_node
    }
  }

  getNext() {
    return this.returnedNode
  }

  getNextStatementNode() {
    return this.next_statement_node
  }
}

module.exports = IfNode
