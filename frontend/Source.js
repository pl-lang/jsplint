"use strict"

let EOF_REACHED = -2
let EON_REACHED = -1
let READING_LINE = 0

class Source {
  constructor(string) {
    this.EON = '\n'
    this.EOF = String.fromCharCode(0)

    this.lines = string.split(/\n|\r/g).filter(Boolean)
    this.lineAmount = this.lines.length

    this.currentLine = this.lines[0]

    this._currentCharIndex = 0
    this._currentLineIndex = 0

    this.state = READING_LINE
  }

  currentChar() {
    if (this.state === EON_REACHED)
      return this.EON
    else if (this.state === EOF_REACHED)
      return this.EOF
    else
      return this.currentLine[this._currentCharIndex]
  }

  nextChar() {
    if (this.state === EON_REACHED)
      this.advanceLine()
    else if (this.state !== EOF_REACHED)
      if (this._currentCharIndex + 1 < this.currentLine.length)
        ++this._currentCharIndex
      else if (this._currentCharIndex + 1 === this.currentLine.length)
        if (this._currentLineIndex + 1 < this.lineAmount) {
          this.state = EON_REACHED
        }
        else
          this.state = EOF_REACHED

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
    this.state = READING_LINE
  }
}

module.exports = Source
