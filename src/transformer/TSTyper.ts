import {Failure, Success, S0, S1, S2, Typed} from '../interfaces'
import {drop} from '../utility/helpers'

export default function transform (ast: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.Program> {
    let errors: Typed.ExtraIndexesError[] = []

    const typed_program: Typed.Program = {}

    const main_report = transfor_module(ast.modules.main, ast)

    if (main_report.error) {
        errors = errors.concat(main_report.result)
    }
    else {
        typed_program['main'] = main_report.result as Typed.Module
    }

    for (let name in ast.modules.user_modules) {
        const report = transfor_module(ast.modules.user_modules[name], ast)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            typed_program[name] = report.result as Typed.Module
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: typed_program}
    }
}

function transfor_module (m: S2.Module | S2.Main, p: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.Module> {
    let errors: Typed.ExtraIndexesError[] = []

    let typed_module: Typed.Module

    if (m.module_type == 'main') {
        typed_module = {
            body: [],
            module_type: 'main',
            return_type: 'ninguno',
            parameters: []
        }
    }
    else {
        typed_module = {
            body: [],
            module_type: p.modules.user_modules[m.name].module_type,
            return_type: p.modules.user_modules[m.name].return_type,
            parameters: p.modules.user_modules[m.name].parameters
        }
    }

    for (let a of m.body) {
        const report = transform_statement(a, m.name, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            typed_module.body.push(report.result as Typed.Statement)
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: typed_module}
    }
}

function transform_statement (a: S2.Statement, mn: string, p: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.Statement> {
    switch (a.type) {
        case 'assignment':
            return transform_assignment (a, mn, p)
        case 'for':
        case 'while':
        case 'until':
        case 'if':
        break
    }
}

function transform_assignment (a: S2.Assignment, mn: string, p: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.Assignment> {
    let errors: Typed.ExtraIndexesError[] = []

    const left_type =  type_variable(a.left, mn, p)

    if (left_type.error) {
        errors = errors.concat(left_type.result)
    }

    const right_type = type_expression(a.right, mn, p)

    if (right_type.error) {
        errors = errors.concat(right_type.result)
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: {type: 'assignment', left: left_type.result as Typed.Invocation, right: right_type.result as Typed.ExpElement[]}}
    }
}

function type_variable (iv: S2.InvocationInfo, mn: string, p: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.Invocation> {
    let errors: Typed.ExtraIndexesError[] =  []

    if (iv.indexes.length > iv.dimensions.length)  {
        /**
         * Se esta invocando una variable con mas indices
         * de los permitidos.
         */
        errors.push({reason:'@invocation-extra-indexes', name: iv.name, dimensions: iv.dimensions.length,indexes: iv.indexes.length})

        /**
         * Solo queda ver si tambien hay errores en esos indices...
         */
        for (let index of iv.indexes) {
            const report = type_expression(index, mn, p)
            if (report.error) {
                for (let error of report.result) {
                    errors.push(error)
                }
            }
            /**
             * Ignoro el caso donde no se encontro un error en el indice
             * porque basta con que se encuentre un error para devolver
             * Failure<...>
             */
        }

        return {error: true, result: errors}
    }

    if (iv.is_array) {
        /**
         * Se esta invocando una variable correctamente y la variable es un arreglo
         * indexado.
         */

        /**
         * Si la variable es un arreglo puede tener muchas dimensiones.
         * Una variable de muchas dimensiones puede verse como un vector
         * de vectores donde cada vector puede contener un vector o un tipo
         * 'atomico'.
         * 
         * Un vector[2][3][2] puede verse como dos matrices 3x2 o un vector 2 que 
         * contiene dos vectores 3, cuyas celdas contienen vectores 2.  
         */

        const remaining_dimensions = drop(iv.dimensions.length - iv.indexes.length, iv.dimensions)
        let last_type: Typed.Type
        for (let i = remaining_dimensions.length - 1; i >= 0; i--) {
            if (i == remaining_dimensions.length - 1) {
                last_type = new Typed.ArrayType(new Typed.AtomicType(iv.datatype), remaining_dimensions[i])
            }
            else {
                last_type = new Typed.ArrayType(last_type, remaining_dimensions[i])
            }
        }

        /**
         * tipos de los indices o errores encontrados en ellos
         */
        const indextypes_report = type_indexes(iv.indexes, mn, p)

        if (indextypes_report.error) {
            return indextypes_report
        }
        else {
            const result: Typed.Invocation = {
                type: 'invocation',
                datatype: last_type,
                indextypes: indextypes_report.result as Typed.ExpElement[][]
            }
            return {error: false, result}
        }
    }
    else {
        /**
         * Se esta invocando una variable normal o un arreglo sin indices.
         */
        const result: Typed.Invocation = {
            datatype: new Typed.AtomicType(iv.datatype),
            indextypes: [],
            type: 'invocation'
        }

        return {error: false, result}
    }
}

function type_expression (es: S2.ExpElement[], mn: string, p: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.ExpElement[]> {
    const typed_exp: Typed.ExpElement[] = []
    let errors: Typed.ExtraIndexesError[] = []

    for (let e of es) {
        switch (e.type) {
            case 'invocation':
                {
                    const report = type_invocation(e, mn, p)
                    if (report.error) {
                        errors = errors.concat(report.result)
                    }
                    else {
                        typed_exp.push(report.result as Typed.Invocation)
                    }
                }
                break
            case 'literal':
                typed_exp.push(type_literal(e))
                break
            case 'call':
            break
            case 'operator':
                typed_exp.push(e as S0.OperatorElement)
            break
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: typed_exp}
    }
}

function type_invocation (i: S2.InvocationValue, mn: string, p: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.Invocation> {
    let errors: Typed.ExtraIndexesError[] = []
    let datatype: Typed.Type

    if (i.is_array) {
        const indextypes_report = type_indexes(i.indexes, mn, p)

        if (i.indexes.length > i.dimensions.length) {
            const error: Typed.ExtraIndexesError = {
                reason: '@invocation-extra-indexes',
                name: i.name,
                indexes: i.indexes.length,
                dimensions: i.dimensions.length
            }

            errors.push(error)
        }
        else if (i.indexes.length == i.dimensions.length) {
            /**
             * Si tienen la misma cantidad de indices que dimensiones
             * solo hay que calcular el tipo resultante y los tipos
             * de los indices.
             */
            datatype = new Typed.AtomicType(i.datatype)
        }
        else {
            const remaining_dimensions = drop(i.indexes.length, i.dimensions)
            let last_type: Typed.Type
            for (let j = remaining_dimensions.length - 1; j >= 0; j--) {
                if (j == remaining_dimensions.length - 1) {
                    last_type = new Typed.ArrayType(new Typed.AtomicType(i.datatype), remaining_dimensions[j])
                }
                else {
                    last_type = new Typed.ArrayType(last_type, remaining_dimensions[j])
                }
            }

            datatype = last_type
        }

        if (errors.length > 0 || indextypes_report.error)  {
            if (indextypes_report.error) {
                errors = errors.concat(indextypes_report.result)
            }
            return {error: true, result: errors}
        }
        else {
            const result: Typed.Invocation = {
                datatype,
                indextypes: indextypes_report.result as Typed.ExpElement[][],
                type: 'invocation'
            }
            return {error: false, result}
        }
    }
    else {
        const result: Typed.Invocation = {
            datatype: new Typed.AtomicType(i.datatype),
            indextypes: [],
            type: 'invocation'
        }
        return {error: false, result}
    }
}

function type_indexes (indexes: S2.ExpElement[][], mn: string, p: S2.AST): Failure<Typed.ExtraIndexesError[]>|Success<Typed.ExpElement[][]> {
    /**
     * arreglo con los tipos de los indices
     */
    const indextypes: Typed.ExpElement[][] = []

    let errors: Typed.ExtraIndexesError[] = []

    for (let index of indexes) {
        const report = type_expression(index, mn, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            indextypes.push(report.result as Typed.ExpElement[])
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: indextypes}
    }
}

/**
 * Fix para la falta de "trunc" en typescript/lib.d.ts (a la fecha 25/01/2017)
 */
declare interface Math {
    trunc(x: number): number
}

declare const Math: Math;

function type_literal (l: S0.LiteralValue): Typed.Type {
    switch (typeof l.value) {
        case 'boolean':
            return new Typed.AtomicType('logico')
        case 'string':
            return (l.value as String).length > 1 ? new Typed.StringType((l.value as String).length):new Typed.AtomicType('caracter')
        case 'number': {
            return (l.value as number) - Math.trunc(l.value as number) > 0 ? new Typed.AtomicType('real'):new Typed.AtomicType('entero')
        }
    }
}