'use strict'

/**
 * Eventos que emite:
 * 	- program-started
 * 	- program-paused
 * 	- program-finished
 * 	- evaluation-error
 *  - write
 *  - read
 */

import {Evaluator} from './Evaluator'

import Emitter from '../utility/Emitter.js'

import {S3, Value, Failure, Success, S0, Typed, Errors} from '../interfaces'

import {type_literal, types_are_equal, stringify} from '../utility/helpers'

export default class Interpreter extends Emitter {
  private evaluator: Evaluator
  private running: boolean
  paused: boolean
  data_read: boolean
  private read_stack: {name: string, type: (Typed.AtomicType | Typed.StringType)}[]

  constructor(p: S3.Program) {
    super(['program-started', 'program-resumed', 'program-paused', 'program-finished'])

    this.evaluator = new Evaluator(p)
    this.running = true
    this.paused = false
    this.data_read = false
    this.read_stack = []
  }

  run() {

    // Esto es necesario porque el interprete se "pausa" cuando un modulo hace
    // una llamada a leer
    if (this.paused && this.data_read) {
      this.emit('program-resumed')
      this.paused = false
      this.running = true
      this.data_read = false
    }
    else {
      this.emit('program-started')
    }

    let done = false

    while (this.running && done == false) {

      const evaluation_report = this.evaluator.step()

      if (evaluation_report.error) {
        done = true
        this.emit('evaluation-error', evaluation_report.result)
      }
      else if (evaluation_report.error == false) {
        switch (evaluation_report.result.action) {
          case 'read':
            this.emit('read')
            this.read_stack.push({name: evaluation_report.result.name, type: evaluation_report.result.type})
            break
          case 'write':
            this.emit('write', evaluation_report.result.value)
          case 'none':
            break
          case 'paused':
            this.paused = true
            this.running = false
            break
        }
        done = evaluation_report.result.done
        if (done) {
          this.running = false
        }
      }
    }

    /**
     * Esto determina que evento emitir si la ejecucion sale del
     * bucle anterior. Hay dos motivos para salir de ese bucle:
     *  - el evaluador esta pausado esperando que finalice una lectura
     *  - hubo un error o el programa finalizó
     */
    if (this.paused) {
      this.emit('program-paused')
    }
    else {
      this.emit('program-finished')
    }
  }

  send (value: string) {
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
        /**
         * Emitir el error
         */
        this.emit('evaluation-error', error)
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
        /**
         * Emitir el error
         */
        this.emit('evaluation-error', error)
      }
    }
    else {
      /**
       * Los tipos son compatibles! Hay que enviarlos al evaluador
       */
      this.evaluator.input(l.value)
      this.data_read = true
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
