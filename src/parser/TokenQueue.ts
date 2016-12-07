'use strict'
import { EoFToken, Token } from './TokenTypes.js'

export default class TokenQueue {
  private tokens : Token[]
  private total_elements : number
  private current_index : number
  private eof_reached : boolean
  private checkpoint_set : boolean
  private checkpoints : number[]

  constructor(array : Token[]) {
    this.tokens = array
    this.total_elements = array.length
    this.current_index = 0
    this.eof_reached = false
    this.checkpoint_set = false
    this.checkpoints = []
  }

  current() : Token {
    if (this.eof_reached) {
      return new EoFToken()
    }
    else {
      return this.tokens[this.current_index]
    }
  }

  next() : Token {
    if (this.current_index + 1 < this.total_elements)
      ++this.current_index
    else
      this.eof_reached = true

    return this.current()
  }

  peek() : Token {
    if (this.current_index + 1 < this.total_elements)
      return this.tokens[this.current_index + 1]
    else
      return new EoFToken()
  }

  set_checkpoint() {
     this.checkpoints.push(this.current_index)
     this.checkpoint_set = true
  }

  rewind () {
    if (this.checkpoint_set) {
      this.current_index = this.checkpoints.pop()
      
      if (this.checkpoints.length == 0) {
        this.checkpoint_set = false
      }

      if (this.eof_reached) {
        this.eof_reached = false
      }
    }
  }
}
