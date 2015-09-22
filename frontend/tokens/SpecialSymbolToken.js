'use strict'

let list = [
  '+'   ,
  '-'   ,
  '/'   ,
  '*'   ,
  '^'   ,
  '<-'  ,
  '<='  ,
  '<>'
  '<'   ,
  '>'   ,
  '>='  ,
  '('   ,
  ')'   ,
  '['   ,
  ']'
]

let symbols = new Set(list)

class SpecialSymbolToken {
  constructor(source) {
    this.lineNumber = source._currentLineIndex
    this.columnNumber = source._currentCharIndex
    this.extract(source)
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
              this.kind = 'less-than'
              this.text += source.nextChar()
              break
          }
        }
        break
      case '>':
        {
          let peek = source.peekChar()
          if (peek === '=')
            this.kind = 'major-equal'
          else
            this.kind = 'major-than'
        }
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
    }
    // consumir el caracer actual
    source.nextChar()
  }
}
