"use strict"

let EOF_REACHED = -2
let EOL_REACHED = -1
let READING_LINE = 0

class Source {
  constructor(string) {
    this.EOL = '\n'
    this.EOF = String.fromCharCode(0)

    this.lines = string.replace(/\r/g, '').split(/\n/g)
    this.lineAmount = this.lines.length

    this.currentLine = this.lines[0]

    this._currentCharIndex = 0
    this._currentLineIndex = 0

    this.updateState()
  }

  currentChar() {
    if (this.state === EOL_REACHED)
      return this.EOL
    else if (this.state === EOF_REACHED)
      return this.EOF
    else
      return this.currentLine[this._currentCharIndex]
  }

  nextChar() {
    this._currentCharIndex++
    this.updateState()
    return this.currentChar()
  }

  peekChar() {
    if (this._currentCharIndex + 1 < this.currentLine.length) {
      return this.currentLine[this._currentCharIndex + 1]
    }
    else {
      return this.EOL
    }
  }

  advanceLine() {
    ++this._currentLineIndex
    this.currentLine = this.lines[this._currentLineIndex]
    this._currentCharIndex = 0
    this.state = READING_LINE
  }

  updateState() {
    if (this.state === EOL_REACHED) {
      this.advanceLine()
    }

    if (this._currentCharIndex + 1 > this.currentLine.length) {
      if (this._currentLineIndex + 1 < this.lineAmount) {
        this.state = EOL_REACHED
      }
      else {
        this.state = EOF_REACHED
      }
    }
    else {
      this.state = READING_LINE
    }
  }
}

module.exports = Source
