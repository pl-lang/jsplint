"use strict"
class TokenList {
  constructor(tokenArray) {
    this.tokenArray = []
    this.currentTokenIndex = 0

    if (tokenArray !== undefined)
      this.tokenArray = tokenArray
  }

  push(token) {
    this.tokenArray.push(token)
  }

  pop() {
    return this.tokenArray.pop()
  }

  currentToken() {
    if (this.currentTokenIndex < this.tokenArray.length)
      return this.tokenArray[this.currentTokenIndex]
  }

  nextToken() {
    if (this.currentTokenIndex + 1 < this.tokenArray.length)
      ++this.currentTokenIndex

    return this.currentToken()
  }

  peekToken() {
    if (this.currentTokenIndex + 1 < this.tokenArray.length)
      return this.tokenArray[this.currentTokenIndex + 1]
  }

}

module.exports = TokenList
