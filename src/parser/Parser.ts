'use strict'

import Emitter from '../utility/Emitter'
import {Failure, Success, Token} from '../interfaces'
import SourceWrapper from './SourceWrapper'
import Lexer from './Lexer'
import TokenQueue from './TokenQueue'
import {MainModule as MainModulePattern, skipWhiteSpace} from './Patterns'
import {FunctionModule as FunctionPattern, ProcedureModule as ProcedurePattern} from './Patterns'
import {S0, ParsedProgram, PatternError} from '../interfaces'

export default class Parser extends Emitter {
  constructor() {
    super(['parsing-started', 'lexical-error', 'syntax-error', 'parsing-finished'])
  }

  parse(code: string) : Failure<string> | Success<ParsedProgram>  {
    this.emit('parsing-started')

    const source = new SourceWrapper(code)
    const lexer = new Lexer()

    const lexer_report = lexer.tokenize(source)

    // emitir eventos de error si hubo alguno y finalizar parseo
    if (lexer_report.error) {
      for (let error_report of lexer_report.result) {
        this.emit('lexical-error', error_report)
      }
      this.emit('parsing-finished', {error:true, result:'lexical-error'})
      return {error:true, result:'lexical-error'}
    }

    let token_queue = new TokenQueue(lexer_report.result as Token[])

    skipWhiteSpace(token_queue)

    // buscar el modulo principal
    const main_match = MainModulePattern(token_queue)

    if (main_match.error) {
      this.emit('syntax-error', main_match.result)
      return {error:true, result:'syntax-error'}
    }
    else if (main_match.error == false) {
      const result: ParsedProgram = {
        main: main_match.result,
        user_modules: {}
      }

      // parsear el resto de los modulos del programa
      while (token_queue.current().name !== 'eof') {
        skipWhiteSpace(token_queue)

        let module_match: (Failure<PatternError> | Success<S0.Procedure>) | (Failure<PatternError> | Success<S0.Function>)

        if (token_queue.current().name == 'procedimiento') {
          module_match = ProcedurePattern(token_queue)
        }
        else {
          module_match = FunctionPattern(token_queue)
        }

        skipWhiteSpace(token_queue)

        // si hubo un error emitir un error de sintaxis y finalizar parseo
        if (module_match.error) {
          this.emit('syntax-error', module_match.result)
          return {error:true, result:'syntax-error'}
        }
        else if (module_match.error == false) {
          result.user_modules[module_match.result.name] = module_match.result
        }
      }

      this.emit('parsing-finished', {error:false})

      return {error:false, result}
    }
  }
}
