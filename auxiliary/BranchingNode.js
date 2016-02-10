'use strict'

/**
 * Clase que representa una bifurcacion en la lista. Adhiere a la interfaz de
 * Nodo (la clase debe tener setNext y getNext) estableciendo que setNext
 * altera el valor de leftBranchNode. No hay metodo para modificar
 * rightBranchNode, se lo pude modificar directamente. Para decidir que camino
 * tomar, getNext toma un boolean.
 */
class BranchingNode {
  constructor(data) {
    if (data) {
      this.data = data
    } else {
      this.data = null
    }

    this.leftBranchNode = null
    this.rightBranchNode = null
  }

  setNext(nextNode) {
    this.leftBranchNode = nextNode
  }

  getNext(getRight) {
    if (getRight) {
      return this.rightBranchNode
    } else {
      return this.leftBranchNode
    }
  }
}

module.exports = BranchingNode
