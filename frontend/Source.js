"use strict"

class Source {
  constructor(string) {
    this.EON = '\n'
    this.EOF = String.fromCharCode(0)

    this.lines = string.split(/\n|\r/g).filter(Boolean)
    this.lineAmount = this.lines.length

    this.currentLine = this.lines[0]

    this._currentCharIndex = 0
    this._currentLineIndex = 0
  }

  currentChar() {
    if (this._currentCharIndex === -1)
      return this.EON
    else if (this._currentCharIndex === -2)
      return this.EOF
    else
      return this.currentLine[this._currentCharIndex]
  }

  nextChar() {
    if (this._currentCharIndex === -1)
      this.advanceLine()
    else if (this._currentCharIndex !== -2)
      if (this._currentCharIndex + 1 < this.currentLine.length)
        ++this._currentCharIndex
      else if (this._currentCharIndex + 1 === this.currentLine.length)
        if (this._currentLineIndex + 1 < this.lineAmount)
          this._currentCharIndex = -1
        else
          this._currentCharIndex = -2

    return this.currentChar()
  }

  peekChar() {
    if (this._currentCharIndex + 1 < this.currentLine.length) {
      return this.currentLine[this._currentCharIndex + 1]
    }
    else {
    }
      return this.EON
  }

  advanceLine() {
    ++this._currentLineIndex
    this.currentLine = this.lines[this._currentLineIndex]
    this._currentCharIndex = 0
  }
}

module.exports = Source
