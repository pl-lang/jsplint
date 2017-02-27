'use strict'

import Evaluator from './Evaluator'

import { S3, Value, Failure, Success, S0, Typed, Errors, InterpreterRead, InterpreterStatementInfo, InterpreterDone, InterpreterWrite, StatementInfo } from '../interfaces'

import {type_literal, types_are_equal, stringify} from '../utility/helpers'

export default class Interpreter {
  private evaluator: Evaluator
  private paused: boolean
  private data_read: boolean
  private read_stack: {name: string, type: (Typed.AtomicType | Typed.StringType)}[]
  private current_program: S3.Program
  private statement_visited: boolean
  private error_ocurred: boolean
  private program_set: boolean
  private last_info: StatementInfo

  constructor() {
    this.paused = false
    this.data_read = false
    this.read_stack = []
    this.error_ocurred = false
    this.program_set = false
    this.statement_visited = false
  }

  get program(): S3.Program {
    return this.current_program
  }

  set program(p: S3.Program) {
    this.current_program = p
    this.evaluator = new Evaluator(p)
    this.paused = false
    this.data_read = false
    this.read_stack = []
    this.error_ocurred = false
    this.program_set = true
  }

  is_done() {
    return this.error_ocurred || this.evaluator.is_done()
  }

  run(): Failure<Errors.OutOfBounds> | Success<InterpreterRead | InterpreterWrite | InterpreterDone> {
    if (this.program_set && !this.error_ocurred) {
      // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
      // una llamada a leer

      while (!this.evaluator.is_done() && !this.error_ocurred) {
        const evaluation_report = this.evaluator.step()

        if (evaluation_report.error == true) {
          this.error_ocurred = true
          return evaluation_report
        }
        else {
          if (evaluation_report.result.kind == 'action') {

            switch (evaluation_report.result.action) {
              case 'read':
                this.read_stack.push({ name: evaluation_report.result.name, type: evaluation_report.result.type })
                return { error: false, result: { kind: 'action', done: this.evaluator.is_done(), action: 'read' } }
              case 'write':
                return { error: false, result: { kind: 'action', done: this.evaluator.is_done(), action: 'write', value: evaluation_report.result.value } }
              case 'none':
                break
              case 'paused':
                break
            }
          }
        }
      }

      return { error: false, result: { kind: 'info', type: 'interpreter', done: this.evaluator.is_done(), error_ocurred: this.error_ocurred } }
    }
    else {
      if (!this.program_set) {
        throw new Error('No program set')
      }
      else {
        throw new Error('Trying to resume the execution of a program with errors')
      }
    }
  }

  step(): Failure<Errors.OutOfBounds> | Success<InterpreterRead | InterpreterStatementInfo | InterpreterWrite> {
    if (this.program_set && !this.error_ocurred) {
      // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
      // una llamada a leer

      if (!this.evaluator.is_done() && !this.error_ocurred) {

        let info = this.evaluator.get_statement_info()
        this.last_info = info

        while (!this.evaluator.is_done() && !this.error_ocurred && (!info.is_user_statement || this.statement_visited)) {
          this.statement_visited = false

          // evaluar el enunciado actual
          let evaluation_report = this.evaluator.step()

          if (evaluation_report.error == true) {
            this.error_ocurred = true
            return evaluation_report
          }
          else {

            switch (evaluation_report.result.action) {
              case 'read':
                this.read_stack.push({ name: evaluation_report.result.name, type: evaluation_report.result.type })
                return { error: false, result: { kind: 'action', done: this.evaluator.is_done(), action: 'read' } }
              case 'write':
                return { error: false, result: { kind: 'action', done: this.evaluator.is_done(), action: 'write', value: evaluation_report.result.value } }
              case 'none':
                break
              case 'paused':
                this.paused = true
                return { error: false, result: { kind: 'info', type: 'statement', pos: this.last_info.pos } }
            }
          }

          if (!this.evaluator.is_done()) {
            info = this.evaluator.get_statement_info()
            this.last_info = info
          }
        }

        this.statement_visited = true

        return { error: false, result: { kind: 'info', done: false, type: 'statement', pos: info.pos } }
      }
    }
    else {
      if (!this.program_set) {
        throw new Error('No program set')
      }
      else {
        throw new Error('Trying to resume the execution of a program with errors')
      }
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
        this.error_ocurred = true

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
        this.error_ocurred = true

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
