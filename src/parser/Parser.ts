'use strict'

import Emitter from '../utility/Emitter'
import {Failure, Success, Token, SymbolKind} from '../interfaces'
import SourceWrapper from './SourceWrapper'
import Lexer from './Lexer'
import TokenQueue from './TokenQueue'
import {MainModule as MainModulePattern, Expression, Literal, skipWhiteSpace} from './Patterns'
import {FunctionModule as FunctionPattern, ProcedureModule as ProcedurePattern} from './Patterns'
import {S0, ParsedProgram, Errors} from '../interfaces'

export default class Parser extends Emitter {
  constructor() {
    super(['parsing-started', 'lexical-error', 'syntax-error', 'parsing-finished'])
  }

  parse(code: string) : Failure<Errors.Lexical[] | Errors.Pattern[]> | Success<ParsedProgram>  {
    this.emit('parsing-started')

    const source = new SourceWrapper(code)
    const lexer = new Lexer()

    const lexer_report = lexer.tokenize(source)

    // emitir eventos de error si hubo alguno y finalizar parseo
    if (lexer_report.error) {
      return {error: true, result: lexer_report.result}
    }

    let token_queue = new TokenQueue(lexer_report.result as Token[])

    skipWhiteSpace(token_queue)

    // buscar el modulo principal
    const main_match = MainModulePattern(token_queue)

    if (main_match.error) {
      return {error: true, result: [main_match.result]}
    }
    else if (main_match.error == false) {
      const result: ParsedProgram = {
        main: main_match.result,
        user_modules: {}
      }

      // parsear el resto de los modulos del programa
      while (token_queue.current().name !== 'eof') {
        skipWhiteSpace(token_queue)

        let module_match: (Failure<Errors.Pattern> | Success<S0.Procedure>) | (Failure<Errors.Pattern> | Success<S0.Function>)

        if (token_queue.current().name == 'procedimiento') {
          module_match = ProcedurePattern(token_queue)
        }
        else {
          module_match = FunctionPattern(token_queue)
        }

        skipWhiteSpace(token_queue)

        // si hubo un error emitir un error de sintaxis y finalizar parseo
        if (module_match.error) {
          return {error: true, result: [module_match.result]}
        }
        else if (module_match.error == false) {
          result.user_modules[module_match.result.name] = module_match.result
        }
      }

      this.emit('parsing-finished', {error:false})

      return {error:false, result}
    }
  }

  leerExpresion(e: string): Failure<Errors.Pattern[] | Errors.Lexical[]> | Success<S0.ExpElement[]> {
    const source = new SourceWrapper(e)
    const lexer = new Lexer()

    const lexer_report = lexer.tokenize(source)

    if (lexer_report.error == true) {
      return lexer_report
    }
    else {
      const tokens = new TokenQueue(lexer_report.result)
      const expresion = Expression(tokens, tk => tk == SymbolKind.EOL || tk == SymbolKind.EOF)
      if (expresion.error == true) {
        return { error: true, result: [expresion.result] }
      }
      else {
        return expresion
      }
    }
  }

  leerLiteral(l: string): Failure<(Errors.Lexical | Errors.Pattern)[]> | Success<S0.LiteralValue> {
    const fuente = new SourceWrapper(l)
    const lexer = new Lexer()

    const reporte = lexer.tokenize(fuente)

    if (reporte.error == true)  {
      return reporte
    }
    else {
      const tokens = new TokenQueue(reporte.result)
      const valor = Literal(tokens)

      if (valor.error == true) {
        const errores = [valor.result]
        return { error: true, result: errores }
      }
      else {
        return valor
      }
    }
  }
}
