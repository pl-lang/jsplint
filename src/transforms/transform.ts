import {Failure, Success, ParsedProgram, S1, S2, N3, Typed, CompileError, TransformedProgram} from '../interfaces'

import stage1 from '../transforms/Declarator'

import stage2 from '../transforms/CallDecorator'

import TransformadorEvaluable from '../transforms/TransformacionEvaluable'

import typecheck from '../typechecker/TSChecker'

import typer from '../transforms/TSTyper'

export default function transform (p: ParsedProgram) : CompileError | Success<N3.Enunciado[]> {
    const s1 = stage1(p)

    if (s1.error) {
        return s1
    }
    else if (s1.error == false) {
        const s2 = stage2(s1.result)

        if (s2.error) {
            return s2
        }
        else if (s2.error == false) {
            const typed_program = typer(s2.result)

            if (typed_program.error) {
                return typed_program
            }
            else {
                const type_errors = typecheck(typed_program.result as Typed.Program)

                if (type_errors.length > 0) {
                    return {error: true, result: type_errors}
                }
                else {
                    const transformador = new TransformadorEvaluable()

                    const programa = transformador.transformar((typed_program.result as Typed.Program))

                    return {error:false, result: programa.result.enunciados}
                }
            }
        }
    }
}