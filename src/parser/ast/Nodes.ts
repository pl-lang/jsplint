'use strict'

import {Node, getLastNode} from './List.js'

export class GenericNode<A> implements Node<A> {
  data: any
  private _next: Node<A>

  constructor (data: any) {
    if (data) {
      this.data = data
    } else {
      this.data = null
    }

    this._next = null;
  }

  setNext (n: Node<A>) {
    this._next = n
  }

  getNext () {
    return this._next
  }

  getNextStatementNode () {
    return this.getNext()
  }
}

export class IfNode<A> implements Node<A> {
  data: A
  false_branch_root: Node<A>
  true_branch_root: Node<A>
  next_statement_node: Node<A>
  next_node: Node<A>

  constructor(data: any) {
    if (data) {
      this.data = data
    } else {
      this.data = null
    }

    this.false_branch_root = null
    this.true_branch_root = null

    this.next_statement_node = null
  }

  setNext(node: Node<A>) {
    if (this.false_branch_root === null) {
      this.false_branch_root = node
    }
    else {
      let lastLeft = getLastNode(this.false_branch_root)
      lastLeft.setNext(node)
    }

    if (this.true_branch_root === null) {
      this.true_branch_root = node
    }
    else {
      let lastRight = getLastNode(this.true_branch_root)
      lastRight.setNext(node)
    }

    this.next_statement_node = node
  }

  setCurrentBranchTo(branch_name: 'true_branch' | 'false_branch' | 'next_statement') {
    if (branch_name === 'true_branch') {
      this.next_node = this.true_branch_root
    }
    else if (branch_name === 'false_branch') {
      this.next_node = this.false_branch_root
    }
    else if (branch_name === 'next_statement') {
      this.next_node = this.next_statement_node
    }
  }

  getNext() {
    return this.next_node
  }

  getNextStatementNode() {
    return this.next_statement_node
  }
}

export class UntilNode<A> implements Node<A> {
  data: A
  loop_body_root: Node<A>
  enter_loop_body: boolean
  next_statement_node: Node<A>

  constructor(data: any) {
    if (data) {
      this.data = data
    }
    else {
      this.data = null
    }

    this.loop_body_root = null
    this.enter_loop_body = true
    this.next_statement_node = null
  }

  /**
   * Cambia la rama que va a devolver la llamada a getNext
   * @param {String} branch_name El nombre de la rama que se va a devolver.
   * Puede ser "loop_body" o "program_body"
   */
  setCurrentBranchTo (branch_name: 'loop_body' | 'program_body') {
    if (branch_name === 'loop_body') {
      this.enter_loop_body = true
    }
    else if (branch_name === 'program_body') {
      this.enter_loop_body = false
    }
  }

  getNext() {
    if (this.enter_loop_body === true) {
      return this.loop_body_root
    }
    else {
      return this.next_statement_node
    }
  }

  getNextStatementNode() {
    return this.next_statement_node
  }

  setNext(node: Node<A>) {
    this.next_statement_node = node
  }
}

export class WhileNode<A> implements Node<A> {
  data: A
  _loop_body_root: Node<A>
  enter_loop_body: boolean
  next_statement_node: Node<A>

  constructor(data: any) {
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
  setCurrentBranchTo(branch_name: 'loop_body' | 'program_body') {
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

  setNext(node: Node<A>) {
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
