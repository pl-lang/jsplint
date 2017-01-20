import {Failure, Success, ParsedProgram, S1, S2, S3} from '../interfaces'

import stage1 from '../transformer/Declarator'
import stage2 from '../transformer/CallDecorator'
import stage3 from '../transformer/Interpretable'

export type TransformError = Failure<S1.RepeatedVarError[]> | Failure<(S2.UndefinedModule | S2.UndefinedVariable)[]>

export default function transform (p: ParsedProgram) : TransformError | Success<S3.Program> {
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
            const s3 = stage3(s2.result)
            return s3
        }
    }
}