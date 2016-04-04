'use strict'

export default class SpecialSymbolToken {
  constructor(source) {
    this.lineNumber = source._current_line
    this.columnNumber = source._current_column
    this.extract(source)
  }

  static isSpecialSymbolChar(c) {
    switch (c) {
      case '+':
      case '-':
      case '/':
      case '*':
      case '^':
      case '=':
      case '<':
      case '>':
      case '(':
      case ')':
      case '[':
      case ']':
      case ',':
      case '\n':
        return true
      default:
        return false
    }
  }

  extract(source) {
    this.text = source.currentChar()

    switch (this.text) {
      case '+':
        this.kind = 'plus'
        break
      case '-':
        this.kind = 'minus'
        break
      case '/':
        this.kind = 'divide'
        break
      case '*':
        this.kind = 'times'
        break
      case '^':
        this.kind = 'power'
        break
      case '<':
        {
          let peek = source.peekChar()
          switch (peek) {
            case '-':
              this.kind = 'assignment'
              this.text += source.nextChar()
              break
            case '=':
              this.kind = 'minor-equal'
              this.text += source.nextChar()
              break
            case '>':
              this.kind = 'diff-than'
              this.text += source.nextChar()
              break
            default:
              this.kind = 'minor-than'
              break
          }
        }
        break
      case '>':
        {
          let peek = source.peekChar()
          if (peek === '=') {
            this.kind = 'major-equal'
            this.text += source.nextChar()
          }
          else
            this.kind = 'major-than'
        }
        break
      case '=':
        this.kind = 'equal'
        break
      case '(':
        this.kind = 'left-par'
        break
      case ')':
        this.kind = 'right-par'
        break
      case '[':
        this.kind = 'left-bracket'
        break
      case ']':
        this.kind = 'right-bracket'
        break
      case ',':
        this.kind = 'comma'
        break
      case '\n':
        this.kind = 'eol'
        break
    }
    // consumir el caracer actual
    source.nextChar()
  }
}
