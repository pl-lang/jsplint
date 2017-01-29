import {Failure, Success, ParsedProgram, S1, S2, S3, Typed, CompileError, TransformedProgram} from '../interfaces'

import stage1 from '../transformer/Declarator'
import stage2 from '../transformer/CallDecorator'
import stage3 from '../transformer/Interpretable'
import typecheck from '../typechecker/TSChecker'
import typer from '../transformer/TSTyper'

export default function transform (p: ParsedProgram) : CompileError | Success<S3.Program> {
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
                    const s3 = stage3(typed_program.result as Typed.Program)

                    return {error:false, result: s3.result}
                }
            }
        }
    }
}