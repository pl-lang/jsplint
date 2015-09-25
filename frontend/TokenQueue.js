'use strict'
let EoFToken = require('./tokens/EoFToken.js')

class TokenQueue {
  constructor(array) {
    this.tokens = array
    this.totalElements = array.length
    this.currentIndex = 0
  }

  current() {
    return this.tokens[this.currentIndex]
  }

  next() {
    if (this.currentIndex + 1 < this.totalElements)
      ++this.currentIndex

    return this.current()
  }

  peek() {
    if (this.currentIndex + 1 < this.totalElements)
      return this.tokens[this.currentIndex + 1]
    else
      return new EoFToken()
  }
}

module.exports = TokenQueue
