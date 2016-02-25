'use strict'

class UntilNode {
  constructor(data) {
    if (data) {
      this.data = data
    }
    else {
      this.data = null
    }

    this.loop_body_root = null
    this.next_node = null
    this.enter_loop_body = true
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
      return this.loop_body_root
    }
    else {
      return this.next_node
    }
  }

  setNext(node) {
    this.next_node = node
  }
}

module.exports = UntilNode
