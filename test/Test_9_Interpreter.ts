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

        const interpreter = new Interpreter()

        interpreter.program = p

        let output = interpreter.step()

        interpreter.is_done().should.equal(false)

        output.result.should.deepEqual({ kind: 'info', type: 'statement',  done: false, pos: { line: 3, column: 16 } })

        output = interpreter.step()

        interpreter.is_done().should.equal(false)

        output.result.should.deepEqual({ kind: 'info', type: 'statement', done: false, pos: { line: 4, column: 16 } })

        output = interpreter.step()

        interpreter.is_done().should.equal(true)

        output.result.should.deepEqual({ kind: 'action', action: 'write', done: true, value: 'hola' })
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

        const interpreter = new Interpreter()

        interpreter.program = p

        let output = interpreter.run()

        output.result.should.deepEqual({ kind: 'action', action: 'write', done: true, value: 'hola' })
    })

    it('Interpreter.run tira una excepcion cuando se intenta resumir un programa con errores ', () => {
        const code = `variables
                entero v[2]
            inicio
                v[3] <- 22
            fin
            `
        const p = compile(parse(code))

        const interpreter = new Interpreter()

        interpreter.program = p

        let output = interpreter.run()

        output.error.should.equal(true)

        output.result.should.deepEqual({ bad_index: 0, dimensions: [2], name: 'v', reason: 'index-out-of-bounds', where: 'evaluator', done: true })

        try {
            output = interpreter.run()
        }
        catch (e) {
            (<Error>e).message.should.equal('Trying to resume the execution of a program with errors')
        }
    })

    it('Interpreter.run tira una execepcion cuando se intenta ejecutar un interprete sin programa', () => {
        const code = `variables
                        entero v[2]
                    inicio
                        v[3] <- 22
                    fin
`
        const p = compile(parse(code))

        const interpreter = new Interpreter()

        try {
            let output = interpreter.run()
        }
        catch (e) {
            (<Error>e).message.should.equal('No program set')
        }
    })

    it('Los bucles para ya no generan errores', () => {
        const code = `variables
                        entero i
                    inicio
                        para i <- 1 hasta 2
                            escribir(i)
                        finpara
                    fin`
        const p = compile(parse(code))

        const interpreter = new Interpreter()

        interpreter.program = p

        let output = interpreter.run()

        output = interpreter.run()

        output = interpreter.run()

        interpreter.is_done().should.equal(true)
    })
})