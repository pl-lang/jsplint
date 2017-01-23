import {Failure, Success, ParsedProgram, S1, S2, S3, Typed, TransformError, TransformedProgram} from '../interfaces'

import stage1 from '../transformer/Declarator'
import stage2 from '../transformer/CallDecorator'
import stage3 from '../transformer/Interpretable'
import typer from '../transformer/TSTyper'

export default function transform (p: ParsedProgram) : TransformError | Success<TransformedProgram> {
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
            const typer_report = typer(s2.result)

            if (typer_report.error) {
                return typer_report
            }
            else {
                const s3 = stage3(s2.result)

                return {error:false, result: {typed_program: typer_report.result as Typed.Program, program: s3.result}}
            }
        }
    }
}