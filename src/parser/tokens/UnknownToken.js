'use strict'

export default class UnknownToken {
  constructor(source) {
    this.kind = 'LEXICAL_ERROR'
    this.unexpectedChar = source.currentChar()
    this.atLine = source._current_line
    this.atColumn = source._current_column
    this.reason = 'unknownToken'
    source.nextChar()
  }
}
