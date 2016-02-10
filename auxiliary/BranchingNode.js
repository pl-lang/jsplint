'use strict'

class BranchingNode {
  constructor(data) {
    if (data) {
      this.data = data
    }

    this.leftBranchNode = null
    this.rightBranchNode = null
  }
}

module.exports = BranchingNode
