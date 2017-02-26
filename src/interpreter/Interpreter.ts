'use strict'

import Evaluator from './Evaluator'

import { S3, Value, Failure, Success, S0, Typed, Errors, InterpreterRead, InterpreterState, InterpreterStatementInfo, InterpreterWrite, StatementInfo } from '../interfaces'

import {type_literal, types_are_equal, stringify} from '../utility/helpers'

export default class Interpreter {
  private evaluator: Evaluator
  private running: boolean
  private paused: boolean
  private data_read: boolean
  private read_stack: {name: string, type: (Typed.AtomicType | Typed.StringType)}[]
  private current_program: S3.Program
  private statement_visited: boolean

  constructor(p?: S3.Program) {
    if (p) {
      this.current_program = p
      this.evaluator = new Evaluator(p)
      this.running = true
      this.paused = false
      this.data_read = false
      this.read_stack = []
    }

    this.statement_visited = false
  }

  get program(): S3.Program {
    return this.current_program
  }

  set program(p: S3.Program) {
    if (!this.running) {
      this.current_program = p
      this.evaluator = new Evaluator(p)
      this.running = true
      this.paused = false
      this.data_read = false
      this.read_stack = []
    }
    else {
      throw new Error("Error: tried to change this interpreter's program while it's still running")
    }
  }

  run(): Failure<Errors.OutOfBounds> | Success<InterpreterRead | InterpreterWrite | InterpreterState> {

    // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
    // una llamada a leer
    if (this.paused && this.data_read) {
      this.paused = false
      this.running = true
      this.data_read = false
    }
    else {
      this.running = true
    }

    while (this.running) {
      const evaluation_report = this.evaluator.step()

      if (evaluation_report.error == true) {
        this.running = false
        return evaluation_report
      }
      else {
        if (evaluation_report.result.kind == 'action') {
          
          this.running = !evaluation_report.result.done

          switch (evaluation_report.result.action) {
            case 'read':
              this.read_stack.push({ name: evaluation_report.result.name, type: evaluation_report.result.type })
              return { error: false, result: { kind: 'action', done: !this.running, action: 'read' } }
            case 'write':
              return { error: false, result: { kind: 'action', done: !this.running, action: 'write', value: evaluation_report.result.value } }
            case 'none':
              break
            case 'paused':
              this.paused = true
              this.running = false
              return { error: false, result: { kind: 'info', type: 'interpreter', done: false } }
          }

        }
      }
    }
  }

  step(): Failure<Errors.OutOfBounds> | Success<InterpreterRead | InterpreterState | InterpreterStatementInfo | InterpreterWrite> {
    // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
    // una llamada a leer
    if (this.paused && this.data_read) {
      this.paused = false
      this.running = true
      this.data_read = false
    }

    // obtener informacion del siguiente enunciado
    let info_maybe = this.evaluator.get_statement_info()

    if (info_maybe.error == false) {
      let info = info_maybe.result

      while (this.running && (!info.is_user_statement || this.statement_visited)) {
        this.statement_visited = false

        // evaluar el enunciado actual
        let evaluation_report = this.evaluator.step()

        if (evaluation_report.error == true) {
          return evaluation_report
        }
        else {
          this.running = !evaluation_report.result.done

          switch (evaluation_report.result.action) {
            case 'read':
              this.read_stack.push({ name: evaluation_report.result.name, type: evaluation_report.result.type })
              return { error: false, result: { kind: 'action', done: !this.running, action: 'read' } }
            case 'write':
              return { error: false, result: { kind: 'action', done: !this.running, action: 'write', value: evaluation_report.result.value } }
            case 'none':
              break
            case 'paused':
              this.paused = true
              this.running = false
              return { error: false, result: { kind: 'info', type: 'interpreter', done: false } }
          }
        }

        info = (this.evaluator.get_statement_info() as Success<StatementInfo>).result
      }

      this.statement_visited = true

      return { error: false, result: { kind: 'info', done: false, type: 'statement', pos: info.pos } }
    }
    else {
      return { error: false, result: { kind: 'info', type: 'interpreter', done: true } }
    }
  }

  send(value: string): Failure<Errors.IncompatibleTypes | Errors.LongString> | Success<null> {
    /**
     * tipar value
     * revisar que coincida con el tipo que el evaluador espera
     *  si no coincide: finaliza la ejecucion el programa y se devuelve un error
     *  si coincide: se envia el valor al evaluador como se venia haciendo hasta ahora
     */
    const l = this.parse(value)

    const literal_type = type_literal(l).typings.type
    const var_info = this.read_stack.pop()

    const cond_a = literal_type.kind == 'atomic' && var_info.type.kind == 'atomic'
    const cond_b = (var_info.type as Typed.AtomicType).typename == 'real' && (literal_type as Typed.AtomicType).typename == 'entero'

    if (!(types_are_equal(literal_type, var_info.type) || (cond_a && cond_b))) {
      if (var_info.type instanceof Typed.StringType && literal_type instanceof Typed.StringType) {
        const error: Errors.LongString = {
          vector_length: var_info.type.length,
          string_length: literal_type.length,
          name: var_info.name,
          reason: '@read-long-string',
          type: stringify(var_info.type),
          where: 'interpreter'
        }
        /**
         * Terminar la ejecucion de este programa debido al error
         */
        this.running = false

        return { error: true, result: error }
      }
      else {
        const error: Errors.IncompatibleTypes = {
            reason: '@read-incompatible-types',
            where: 'interpreter',
            expected: stringify(var_info.type),
            received: stringify(literal_type)
        }
        /**
         * Terminar la ejecucion de este programa debido al error
         */
        this.running = false

        return { error: true, result: error }
      }
    }
    else {
      /**
       * Los tipos son compatibles! Hay que enviarlos al evaluador
       */
      this.evaluator.input(l.value)
      this.data_read = true

      return { error: false, result: null }
    }
  }

  parse (value: string): S0.LiteralValue {
    let v: Value = null

    if (/^\d+$/.test(value)) {
      /**
       * es un entero
       */
      v = parseInt(value)
    }
    else if (/^\d+(\.\d+)?$/.test(value)) {
      /**
       * es un real
       */
      v = parseFloat(value)
    }
    else if (/^(verdadero|falso)$/.test(value)) {
      /**
       * es un booleano
       */
      v = value == 'verdadero'
    }
    else {
      /**
       * es una cadena
       */
      v = value
    }

    return {type: 'literal', value: v}
  }
}
