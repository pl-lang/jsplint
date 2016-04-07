'use strict'

import Emitter from '../utility/Emitter.js'
import SourceWrapper from './SourceWrapper.js'
import Lexer from './Lexer.js'
import Scanner from './Scanner.js'
import TokenQueue from './TokenQueue.js'

export default class Parser extends Emitter {
  constructor() {
    super([
      'parsing-started',
      'lexical-error',
      'syntax-error',
      'parsing-finished'
    ])
  }

  parse(code) {
    this.emit('parsing-started')

    let source = new SourceWrapper(code)
    let lexer = new Lexer()

    let lexer_report = lexer.tokenize(source)

    if (lexer_report.error) {
      for (let error_report of lexer_report.result) {
        this.emit('lexical-error', error_report)
      }
      this.emit('parsing-finished', {error:true, result:'lexical-error'})
      return {error:true, result:'lexical-error'}
    }

    let scanner = new Scanner(new TokenQueue(lexer_report.result))

    let scan_report = scanner.getModules()

    if (scan_report.error) {
      this.emit('syntax-error', scan_report.result)
      return {error:true, result:'syntax-error'}
    }

    this.emit('parsing-finished')

    return {error:false, result:scan_report.result}
  }
}
