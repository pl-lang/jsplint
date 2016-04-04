"use strict"

let EOF_REACHED = -2
let EOL_REACHED = -1
let READING = 0

export default class Source {
  constructor(string) {
    this.EOL = '\n'
    this.EOF = String.fromCharCode(0)

    this._source = string.replace(/\r/g, '')

    this._index = 0

    this._current_column = 0
    this._current_line = 0

    this.updateState()
  }

  currentChar() {
    if (this.state === EOF_REACHED) {
      return this.EOF
    }
    else {
      return this._source[this._index]
    }
  }

  nextChar() {
    this._index++
    this.updateState()
    this.updatePosition()
    return this.currentChar()
  }

  peekChar() {
    if (this._index + 1 === this._source.length) {
      return this.EOF
    }
    else {
      return this._source[this._index + 1]
    }
  }

  updateState() {
    if (this._index === this._source.length) {
      this.state = EOF_REACHED
    }
    else {
      this.state = READING
    }
  }

  updatePosition() {
    if (this._source[this._index - 1] === this.EOL) {
      this._current_line++
      this._current_column = 0
    }
    else {
      this._current_column++
    }
  }
}
