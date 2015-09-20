"use strict"
class Source {
  constructor(string) {
    this.text = string
    this._currentCharIndex = 0
    this.EON = '\n'
    this.EOF = String.fromCharCode(0)
  }

  currentChar() {
    if (this._currentCharIndex === -1) {
      return this.EOF
    }
    else {
      return this.text[this._currentCharIndex]
    }
  }

  nextChar() {
    if (this._currentCharIndex + 1 < this.text.length) {
      ++this._currentCharIndex
      return this.currentChar()
    }
    else {
      this._currentCharIndex = -1
      return this.currentChar()
    }
  }

  peekChar() {
    if (this._currentCharIndex + 1 < this.text.length) {
      return this.text[this._currentCharIndex + 1]
    }
    else {
    }
      return this.EOF
  }
}

module.exports = Source
