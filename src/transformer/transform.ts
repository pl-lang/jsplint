import {ParsedProgram} from '../interfaces/ParsingInterfaces'
import {RepeatedVarError} from '../interfaces/Stage1'
import {UndefinedModule, UndefinedVariable} from '../interfaces/Stage2'
import {IError as Failure, ISuccess as Success} from '../interfaces/Utility'
import {AST as s1AST} from '../interfaces/Stage1'
import {AST as s2AST} from '../interfaces/Stage2'
import {Program} from '../interfaces/Program'
import stage1 from '../transformer/Declarator'
import stage2 from '../transformer/CallDecorator'
import stage3 from '../transformer/Interpretable'

export type TransformError = Failure<RepeatedVarError[]> | Failure<(UndefinedModule | UndefinedVariable)[]>

export default function transform (p: ParsedProgram) : TransformError | Success<Program> {
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