'use strict'

import Emitter from '../utility/Emitter.js'
import SourceWrapper from './SourceWrapper.js'
import Lexer from './Lexer.js'
import Scanner from './Scanner.js'
import TokenQueue from './TokenQueue.js'
import { match, MainModule as MainModulePattern, skipWhiteSpace } from './Patterns.js'

export default class Parser extends Emitter {
  constructor() {
    super(['parsing-started', 'lexical-error', 'syntax-error', 'parsing-finished'])
  }

  parse(code) {
    this.emit('parsing-started')

    let result = {
      modules : []
    }

    let source = new SourceWrapper(code)
    let lexer = new Lexer()

    let lexer_report = lexer.tokenize(source)

    // emitir eventos de error si hubo alguno y finalizar parseo
    if (lexer_report.error) {
      for (let error_report of lexer_report.result) {
        this.emit('lexical-error', error_report)
      }
      this.emit('parsing-finished', {error:true, result:'lexical-error'})
      return {error:true, result:'lexical-error'}
    }

    let token_queue = new TokenQueue(lexer_report.result)

    // parsear los modulos del programa, empezando por el principal
    while (token_queue.current().kind !== 'eof') {
      skipWhiteSpace(token_queue)

      let module_match

      switch (token_queue.current().kind) {
        case 'variables':
          module_match = match(MainModulePattern).from(token_queue)
          break
        default:
          throw new TypeError(`${token_queue.current().kind} no coincide con el encabezado de ninguna clase de modulo`)
      }

      // si hubo un error emitir un error de sintaxis y finalizar parseo
      if (module_match.error) {
        this.emit('syntax-error', module_match.result)
        return {error:true, result:'syntax-error'}
      }
      else {
        result.modules.push(module_match.result)
      }
    }

    this.emit('parsing-finished', {error:false})

    return {error:false, result}
  }
}
