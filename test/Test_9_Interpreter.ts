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
    it('Interpreter.step se detiene al encontrar un enunciado', () => {
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

        output.should.deepEqual({ kind: 'info', is_user_statement: true, pos: { line: 3, column: 16 } })

        output = interpreter.step()

        output.should.deepEqual({ kind: 'info', is_user_statement: true, pos: { line: 4, column: 16 } })

        output = interpreter.step()

        output.should.deepEqual({ kind: 'state', done: true })
    })
})