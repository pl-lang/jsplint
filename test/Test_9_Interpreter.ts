'use strict'
import 'should'

import Parser from '../src/parser/Parser.js'

import { ParsedProgram, S1, S3, Errors, Success, Failure } from '../src/interfaces'
import { StatementInfo, Scalar } from '../src/interfaces'

import Interpreter from '../src/interpreter/Interpreter'

import transform from '../src/transforms/transform'

const p = new Parser()

function parse(s: string) {
    p.on('syntax-error', console.log)

    return p.parse(s)
}

function compile(p: Failure<Errors.Lexical[] | Errors.Pattern[]> | Success<ParsedProgram>): S3.Program {
    if (p.error) {
        // for (let error of p.result) {
        //   console.log(error)
        // }
        throw new Error('Se encontraron errores durante la transformacion')
    }
    else if (p.error == false) {
        const tp = transform(p.result)
        if (tp.error) {
            // for (let error of tp.result) {
            //   console.log(error)
            // }
            throw new Error('Se encontraron errores durante la transformacion')
        }
        else if (tp.error == false) {
            return tp.result
        }
    }
}

describe('Interpreter', () => {
    it('Interpreter.step se detiene al encontrar los enunciados creados por el usuario', () => {
        const code = `variables
                entero i
            inicio
                i <- 22
                escribir("hola")
            fin
            `
        const p = compile(parse(code))

        const interpreter = new Interpreter(p)

        let output = interpreter.step()

        output.result.should.deepEqual({ kind: 'info', type: 'statement',  done: false, pos: { line: 3, column: 16 } })

        output = interpreter.step()

        output.result.should.deepEqual({ kind: 'info', type: 'statement', done: false, pos: { line: 4, column: 16 } })

        output = interpreter.step()

        output.result.should.deepEqual({ kind: 'action', action: 'write', done: false, value: 'hola' })

        output = interpreter.step()

        output.result.should.deepEqual({ kind: 'info', type: 'interpreter', done: true })
    })

    it('Interpreter.run se detiene al encontrar un enunciado escribir', () => {
        const code = `variables
                entero i
            inicio
                i <- 22
                i <- 1
                i <- 2
                i <- 23
                escribir("hola")
            fin
            `
        const p = compile(parse(code))

        const interpreter = new Interpreter(p)

        let output = interpreter.run()

        output.result.should.deepEqual({ kind: 'action', action: 'write', done: true, value: 'hola' })
    })
})