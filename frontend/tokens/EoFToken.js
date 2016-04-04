'use strict'

export default class EoFToken {
  constructor(source) {
    this.kind = 'eof'
    if (source) {
      this.columnNumber = source._current_column
      this.lineNumber   = source._current_line
    }
  }
}
