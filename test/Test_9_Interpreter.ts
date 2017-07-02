'use strict'
import 'should'

import Parser from '../src/parser/Parser.js'

import { ParsedProgram, S1, S3, Errors, Success, Failure, BoxedScalar, BoxedVector, BoxedValue } from '../src/interfaces'
import { StatementInfo, Scalar } from '../src/interfaces'

import Interpreter from '../src/interpreter/Interpreter'

describe.skip('Interpreter', () => {
    it('Interpreter.step se detiene al encontrar los enunciados creados por el usuario')

    it('Interpreter.run se detiene al encontrar un enunciado escribir')

    it('Interpreter.run tira una excepcion cuando se intenta resumir un programa con errores ')

    it('Interpreter.run tira una execepcion cuando se intenta ejecutar un interprete sin programa')

    it('Los bucles para ya no generan errores')

    it('Interpreter.export_var funciona')
})