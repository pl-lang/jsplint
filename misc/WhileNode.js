'use strict'

import { getLastNode } from './List.js'

export default class WhileNode {
  constructor(data) {
    if (data) {
      this.data = data
    }
    else {
      this.data = null
    }

    this._loop_body_root = null
    this.next_statement_node = null
    this.enter_loop_body = true
    this.next_statement_node = null
  }

  /**
   * Cambia la rama que va a devolver la llamada a getNext
   * @param {String} branch_name El nombre de la rama que se va a devolver.
   * Puede ser "loop_body" o "program_body"
   */
  setCurrentBranchTo(branch_name) {
    if (branch_name === 'loop_body') {
      this.enter_loop_body = true
    }
    else if (branch_name === 'program_body') {
      this.enter_loop_body = false
    }
  }

  getNext() {
    if (this.enter_loop_body === true) {
      return this._loop_body_root
    }
    else {
      return this.next_statement_node
    }
  }

  getNextStatementNode() {
    return this.next_statement_node
  }

  setNext(node) {
    this.next_statement_node = node

    // Cuando se escribe un mientras con el cuerpo vacio lastNode va a ser null
    // y va a tirar una excepcion...
    // El resultado correcto de un mientras con el cuerpo vacio es un bucle
    // infinito
  }

  set loop_body_root(root_node) {
    this._loop_body_root = root_node

    //  necesario para hacer que el ultimo nodo del bucle apunte al nodo de cond
    let lastNode = getLastNode(this._loop_body_root)

    // o sea, este
    lastNode.setNext(this)
  }

  get loop_body_root() {
    return this._loop_body_root
  }
}
