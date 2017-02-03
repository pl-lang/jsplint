import {Failure, Success, S0, S2, Typed, Errors} from '../interfaces'
import {drop, types_are_equal, stringify, type_literal} from '../utility/helpers'

export default function transform (ast: S2.AST): Failure<Typed.Error[]>|Success<Typed.Program> {
    let errors: Typed.Error[] = []

    const typed_program: Typed.Program = {
        modules: {
            main: null
        },
        variables_per_module: ast.local_variables
    }

    const main_report = transfor_module(ast.modules.main, ast)

    if (main_report.error) {
        errors = errors.concat(main_report.result)
    }
    else {
        typed_program.modules.main = main_report.result as Typed.Module
    }

    for (let name in ast.modules.user_modules) {
        const report = transfor_module(ast.modules.user_modules[name], ast)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            typed_program.modules[name] = report.result as Typed.Module
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: typed_program}
    }
}

function transfor_module (m: S2.Module | S2.Main, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.Module> {
    let errors: Typed.Error[] = []

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
        const parameters: Typed.Parameter[] = []
        const ptypes = type_params(p.modules.user_modules[m.name].parameters)

        for (let i = 0; i < ptypes.length; i++) {
            const {name, by_ref, is_array, dimensions} = p.modules.user_modules[m.name].parameters[i]
            parameters.push({name, by_ref, is_array, dimensions, type: ptypes[i]})
        }

        typed_module = {
            body: [],
            module_type: p.modules.user_modules[m.name].module_type,
            return_type: p.modules.user_modules[m.name].return_type,
            parameters: parameters
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

function transform_statement (a: S2.Statement, mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.Statement> {
    switch (a.type) {
        case 'assignment':
            return transform_assignment (a, mn, p)
        case 'call':
            return type_call(a, mn, p)
        case 'if':
            return transform_if(a, mn, p)
        case 'for':
            return transform_for(a, mn, p)
        case 'while':
            return transform_while(a, mn, p)
        case 'until':
            return transform_until(a, mn, p)
        case 'return':
            return transform_return(a, mn, p)
    }
}

function transform_if (a: S2.If, mn: string, p: S2.AST): Failure<Typed.Error[]> | Success<Typed.If> {
    let errors: Typed.Error[] = []

    const c_report = type_expression(a.condition, mn, p)

    if (c_report.error) {
        errors = errors.concat(c_report.result)
    }

    const typed_tb: Typed.Statement[] = []
    for (let e of a.true_branch) {
        const report = transform_statement(e, mn, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            typed_tb.push(report.result as Typed.Statement)
        }
    }

    const typed_fb: Typed.Statement[] = []
    for (let e of a.false_branch) {
        const report = transform_statement(e, mn, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            typed_fb.push(report.result as Typed.Statement)
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        const cond_type = calculate_type(c_report.result as Typed.ExpElement[])

        if (cond_type.error) {
            return {error: true, result: errors.concat(cond_type.result)}
        }
        else {
            const result: Typed.If = {
                type: 'if',
                condition: c_report.result as Typed.ExpElement[],
                true_branch: typed_tb,
                false_branch: typed_fb,
                typings: {
                    condition: cond_type.result as Typed.Type
                }
            }
            return {error: false, result}
        }
    }
}

function transform_for (f: S2.For, mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.For> {
    let errors: Typed.Error[] = []

    const init = transform_assignment(f.counter_init, mn, p)

    if (init.error) {
        errors = errors.concat(init.result)
    }

    const last = type_expression(f.last_value, mn, p)

    if (last.error) {
        errors = errors.concat(last.result)
    }

    const body: Typed.Statement[] = []
    for (let e of f.body) {
        const report = transform_statement(e, mn, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            body.push(report.result as Typed.Statement)
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        const last_v_type = calculate_type(last.result as Typed.ExpElement[])

        if (last_v_type.error) {
            return {error: true, result: errors.concat(last_v_type.result)}
        }
        else {
            const result: Typed.For = {
                type: 'for',
                counter_init: init.result as Typed.Assignment,
                body: body,
                last_value: last.result as Typed.ExpElement[],
                typings: {
                    init_value: (init.result as Typed.Assignment).typings.right,
                    last_value: last_v_type.result as Typed.Type
                }
            }
            return {error: false, result}
        }
    }
}

function transform_while (w: S2.While, mn: string, p: S2.AST): Failure<Typed.Error[]> | Success<Typed.While> {
    let errors: Typed.Error[] = []

    const c_report = type_expression(w.condition, mn, p)

    if (c_report.error) {
        errors = errors.concat(c_report.result)
    }

    const body_statements: Typed.Statement[] = []
    for (let e of w.body) {
        const report = transform_statement(e, mn, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            body_statements.push(report.result as Typed.Statement)
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        const condition_type = calculate_type(c_report.result as Typed.ExpElement[])

        if (condition_type.error) {
            return {error: true, result: errors.concat(condition_type.result)}
        }
        else {
            const result: Typed.While = {
                type: 'while',
                condition: c_report.result as Typed.ExpElement[],
                body: body_statements,
                typings: {
                    body: body_statements,
                    condition: condition_type.result as Typed.Type
                }
            }
            return {error: false, result}
        }
    }
}

function transform_until (u: S2.Until, mn: string, p: S2.AST): Failure<Typed.Error[]> | Success<Typed.Until> {
    let errors: Typed.Error[] = []

    const c_report = type_expression(u.condition, mn, p)

    if (c_report.error) {
        errors = errors.concat(c_report.result)
    }

    const body_statements: Typed.Statement[] = []
    for (let e of u.body) {
        const report = transform_statement(e, mn, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            body_statements.push(report.result as Typed.Statement)
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        const condition_type = calculate_type(c_report.result as Typed.ExpElement[])

        if (condition_type.error) {
            return {error: true, result: errors.concat(condition_type.result)}
        }
        else {
            const result: Typed.Until = {
                type: 'until',
                condition: c_report.result as Typed.ExpElement[],
                body: body_statements,
                typings: {
                    body: body_statements,
                    condition: condition_type.result as Typed.Type
                }
            }
            return {error: false, result}
        }
    }
}

function transform_return (r: S2.Return, mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.Return> {
    const errors: Typed.Error[] = []

    const exp = type_expression(r.expression, mn, p)

    if (exp.error) {
        return exp
    }
    else {
        /**
         * el tipo del valor de este enunciado 'retornar'
         */
        const report = calculate_type(exp.result as Typed.ExpElement[])

        if (report.error) {
            return report
        }
        else {
            const {type, expected} = r

            const result: Typed.Return = {
                type,
                expression: exp.result as Typed.ExpElement[],
                typings: {
                    actual: report.result as Typed.Type,
                    expected: new Typed.AtomicType('literal', expected)
                }
            }

            return {error: false, result}
        }
    }
}

function type_call (a: S2.ModuleCall, mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.Call> {
    let errors: Typed.Error[] = []

    /**
     * epxresiones de tipo de cada argumento
     */
    const transformed_args: Typed.ExpElement[][] = []

    for (let arg of a.args) {
        const report = type_expression(arg, mn, p)

        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            transformed_args.push(report.result as Typed.ExpElement[])
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        /**
         * reducir las expresiones a tipos
         */

        const type_reports = transformed_args.map(calculate_type)
        const argtypes: Typed.Type[] = []
        let error_found = false

        for (let report of type_reports) {
            if (report.error) {
                error_found = true
                errors = errors.concat(report.result)
            }
            else {
                argtypes.push(report.result as Typed.Type)
            }
        }

        if (error_found) {
            return {error: true, result: errors}
        }
        else {
            const paramtypes = type_params(a.parameters)

            const ret = new Typed.AtomicType('literal', a.return_type)

            const {type, name, parameters} = a

            const result: Typed.Call = {
                type,
                name,
                args: transformed_args,
                parameters,
                typings: {
                    args: argtypes,
                    parameters: paramtypes,
                    return: ret
                }
            }

            return {error: false, result}
        }
    }
}

function type_params (params: S0.Parameter[]): Typed.Type[] {
    const paramtypes: Typed.Type[] = []

    for (let param of params) {
        const inv_or_lit: 'literal' | 'invocation' = param.by_ref ? 'invocation':'literal'
        if (param.is_array) {
            let type: Typed.ArrayType | Typed.StringType = null;
            if (param.type == 'caracter' && param.dimensions.length == 1) {
                type = new Typed.StringType(param.dimensions[0], inv_or_lit)
            }
            else {
                for (let i = param.dimensions.length - 1; i >= 0; i--) {
                    if (i == param.dimensions.length - 1) {
                        type = new Typed.ArrayType(inv_or_lit, new Typed.AtomicType(inv_or_lit, param.type), param.dimensions[i])
                    }
                    else {
                        type = new Typed.ArrayType(inv_or_lit, type, param.dimensions[i])
                    }
                }
            }
            paramtypes.push(type)
        }
        else {
            paramtypes.push(new Typed.AtomicType(inv_or_lit, param.type))
        }
    }

    return paramtypes
}

function transform_invocation (i: S2.InvocationInfo | S2.InvocationValue, mn: string, p: S2.AST): Failure<Errors.ExtraIndexes[]> | Success<Typed.Invocation> {
    let errors: any[] = []

    const index_exps: Typed.ExpElement[][] = []
    for (let index of i.indexes) {
        const report = type_expression(index, mn, p)
        if (report.error) {
            errors = errors.concat(report.result)
        }
        else {
            index_exps.push(report.result as Typed.ExpElement[])
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        const type_reports = index_exps.map(calculate_type)
    } 
}

function transform_assignment (a: S2.Assignment, mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.Assignment> {
    let errors: Typed.Error[] = []

    const left_type = type_invocation(a.left, mn, p)

    if (left_type.error) {
        errors = errors.concat(left_type.result)
    }

    const typed_right = type_expression(a.right, mn, p)

    if (typed_right.error) {
        errors = errors.concat(typed_right.result)

        return {error: true, result: errors}
    }
    else {
        /**
         * reducir la expresion tipada a un solo tipo
         */

        const right_type = calculate_type(typed_right.result as Typed.ExpElement[])

        if (right_type.error) {
            errors = errors.concat(right_type.result)

            return {error: true, result: errors}
        }
        else {
            /**
             * copiar las propiedades que permanecen constantes
             */
            const {type, left, right} = a

            const result: Typed.Assignment = {
                type,
                left: left_type.result as Typed.Invocation,
                right: typed_right.result as Typed.ExpElement[],
                typings: {left: (left_type.result as Typed.Invocation).typings.type, right: right_type.result as Typed.Type}
            }

            return {error: false, result}
        }
    }
}

function type_expression (es: S2.ExpElement[], mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.ExpElement[]> {
    const typed_exp: Typed.ExpElement[] = []
    let errors: Typed.Error[] = []

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
                {
                    const report = type_call(e, mn, p)
                    if (report.error) {
                        errors = errors.concat(report.result)
                    }
                    else {
                        typed_exp.push(report.result as Typed.Call)
                    }
                }
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

function type_invocation (i: (S2.InvocationValue | S2.InvocationInfo), mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.Invocation> {
    let errors: Typed.Error[] = []

    /**
     * el tipo de dato que esta invocacion retorna
     */
    let invocation_datatype: Typed.Type

    if (i.is_array) {
        /**
         * 'expresiones de tipo'
         */
        const type_exps = type_indexes(i.indexes, mn, p)

        if (i.indexes.length > i.dimensions.length) {
            const error: Errors.ExtraIndexes = {
                reason: '@invocation-extra-indexes',
                where: 'typer',
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
            invocation_datatype = new Typed.AtomicType('invocation', i.datatype)
        }
        else {
            /**
             * Como hay menos indices que dimensiones hay que calcular
             * el tipo del valor que esta invocacion retorna
             */
            const remaining_dimensions = drop(i.indexes.length, i.dimensions)
            let last_type: Typed.Type
            for (let j = remaining_dimensions.length - 1; j >= 0; j--) {
                if (j == remaining_dimensions.length - 1) {
                    if (i.datatype == 'caracter') {
                        last_type = new Typed.StringType(remaining_dimensions[j], 'invocation')
                    }
                    else {
                        last_type = new Typed.ArrayType('invocation', new Typed.AtomicType('invocation', i.datatype), remaining_dimensions[j])
                    }
                }
                else {
                    last_type = new Typed.ArrayType('invocation', last_type, remaining_dimensions[j])
                }
            }

            invocation_datatype = last_type
        }

        if (errors.length > 0 || type_exps.error)  {
            if (type_exps.error) {
                errors = errors.concat(type_exps.result)
            }
            return {error: true, result: errors}
        }
        else {
            /**
             * Reducir los indices a tipos individuales...ultima
             * oportunidad para que haya errores
             */
            const types = (type_exps.result as Typed.ExpElement[][]).map(calculate_type)
            let indextype_error_found = false

            for (let report of types) {
                if (report.error) {
                    indextype_error_found = true
                    errors = errors.concat(report.result)
                }
            }

            if (indextype_error_found) {
                return {error: true, result: errors}
            }
            else {
                const indextypes: Typed.Type[] = types.map(t => t.result) as Typed.Type[]
                
                const {dimensions, indexes, name, is_array} = i

                const result: Typed.Invocation = {
                    type: 'invocation',
                    indexes: type_exps.result as Typed.ExpElement[][],
                    dimensions,
                    name,
                    is_array,
                    typings: {
                        indexes: indextypes,
                        type: invocation_datatype
                    }
                }
                return {error: false, result}
            }
        }
    }
    else {
        const {dimensions, datatype, indexes, name, is_array} = i

        const result: Typed.Invocation = {
            type: 'invocation',
            dimensions,
            indexes: [],
            name,
            is_array,
            typings: {
                indexes: [],
                type: new Typed.AtomicType('invocation', datatype)
            }
        }

        return {error: false, result}
    }
}

function type_indexes (indexes: S2.ExpElement[][], mn: string, p: S2.AST): Failure<Typed.Error[]>|Success<Typed.ExpElement[][]> {
    /**
     * arreglo con los tipos de los indices
     */
    const indextypes: Typed.ExpElement[][] = []

    let errors: Typed.Error[] = []

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
 * calculate_type
 * "ejecuta" una expresion de tipos y calcula el tipo resultante
 * 
 * Por ejemplo: entero + entero = entero; entero + real = real
 */

function calculate_type(exp: Typed.ExpElement[]): Failure<Typed.Error[]>|Success<Typed.Type> {
    let stack: Typed.Type[] = []
    let errors: Typed.Error[] = []

    for (let e of exp) {
        switch (e.type) {
            case 'literal':
                stack.push(e.typings.type)
            break
            case 'invocation': 
                stack.push(e.typings.type)
                break
            case 'call':
                stack.push(e.typings.return)
                break
            case 'operator': {
                const op_report = operate(stack, e.name)
                if (op_report.error) {
                    errors = errors.concat(op_report.result)
                }
                else {
                    stack = op_report.result as Typed.Type[]
                }
            }
            break
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: stack.pop() as Typed.Type}
    }
}

function operate (s: Typed.Type[], op: string): Failure<Typed.Error>|Success<Typed.Type[]> {
    switch (op) {
        case 'plus':
        case 'times':
        case 'minus':
        case 'power':
        case 'mod':
            return plus_times(s, op)
        case 'minor':
        case 'minor-eq':
        case 'major':
        case 'major-eq':
        case 'equal':
        case 'different':
            return comparison(s, op)
        case 'slash':
            return slash(s)
        case 'and':
        case 'or':
        case 'not':
            return logical(s, op)
    }
}

/**
 * Los operadores se implementan como funciones que toman una pila,
 * desapilan tantos elementos como necesiten, operan con ellos,
 * apilan el resultado y devuelven la nueva pila.
 * 
 * Tambien pueden devolver un error en caso de que no haya suficientes
 * elementos en la pila o los tipos de estos no sean compatibles entre
 * si o con el operador.
 */

/**
 * plus_times calcula el tipo producido por: una suma, una resta, una multiplicacion,
 * una potencia, y modulo (mod)
 */
function plus_times (s: Typed.Type[], op: string): Failure<Typed.Error>|Success<Typed.Type[]> {
    const supported: string[] = ['entero', 'real']

    if (s.length >= 2) {
        /**
         * Si la expresion era "2 + 3" entonces: a = 3 y b = 2
         */
        const a: string = stringify(s.pop() as Typed.Type)
        const b: string = stringify(s.pop() as Typed.Type)

        if (supported.indexOf(a) == -1 || supported.indexOf(b) == -1 ) {
            /**
             * ERROR: este operador no opera sobre el tipo de alguno de sus operandos
             */

            if (supported.indexOf(a) == -1 && supported.indexOf(b) == -1) {
                const result: Errors.IncompatibleOperands = {reason: 'incompatible-operands', where: 'typer', bad_type_a: a, bad_type_b: b, operator: op}
                return {error: true, result}
            }
            else if (supported.indexOf(a) == -1) {
                const result: Errors.IncompatibleOperand = {reason: 'incompatible-operand', where: 'typer', bad_type: a, operator: op}
                return  {error: true, result}
            }
            else {
                const result: Errors.IncompatibleOperand = {reason: 'incompatible-operand', where: 'typer', bad_type: b, operator: op}
                return  {error: true, result}
            }
        }

        switch (a) {
            case 'entero':
                switch (b) {
                    case 'entero':
                        s.push(new Typed.AtomicType('literal', 'entero'))
                        break
                    case 'real':
                        s.push(new Typed.AtomicType('literal', 'real'))
                        break
                }
                break
            case 'real':
                s.push(new Typed.AtomicType('literal', 'real'))
                break
        }

        return {error: false, result: s}
    }
    else {
        const result: Errors.MissingOperands = {reason: 'missing-operands', where: 'typer', operator: op, required: 2}
        return {error: true, result}
    }
}

function comparison (s: Typed.Type[], op: string): Failure<Errors.BadComparisonOperands|Errors.MissingOperands>|Success<Typed.Type[]> {
    if (s.length >= 2) {
        const a = s.pop()
        const b = s.pop()

        const atomic_cond = a.kind == 'atomic' && b.kind == 'atomic'
        const a_float_or_int = (a as Typed.AtomicType).typename == 'entero' || (a as Typed.AtomicType).typename == 'real'
        const b_float_or_int = (b as Typed.AtomicType).typename == 'entero' || (b as Typed.AtomicType).typename == 'real'

        if (!(((types_are_equal(a, b) && atomic_cond) || (atomic_cond && a_float_or_int && b_float_or_int)))) {
            /**
             * Este error se detecta cuando se intenta comparar datos de tipos incompatibles
             * o cuando alguno de los operandos es un arreglo.
             */
            const result: Errors.BadComparisonOperands = {reason: '@comparison-bad-operands', where: 'typer', left: stringify(b), right: stringify(a)}
            return {error: true, result}
        }
        else {
            s.push(new Typed.AtomicType('literal', 'logico'))
            return {error: false, result: s}
        }
    }
    else {
        const result: Errors.MissingOperands = {reason: 'missing-operands', where: 'typer', operator: op, required: 2}
        return {error: true, result}
    }
}

function slash (s: Typed.Type[]): Failure<Errors.IncompatibleOperands | Errors.MissingOperands> | Success<Typed.Type[]> {
    if (s.length >= 2) {
        const a = s.pop()
        const b = s.pop()

        const a_string = stringify(a)
        const b_string = stringify(b)

        const atomic_cond = a.kind == 'atomic' && b.kind == 'atomic'

        if (!(atomic_cond && (a_string == 'entero' || a_string ==  'real') && (b_string == 'entero' || b_string == 'real'))) {
            /**
             * Este error se detecta cuando se intenta comparar datos de tipos incompatibles
             * o cuando alguno de los operandos es un arreglo.
             */
            const result: Errors.IncompatibleOperands = {reason: 'incompatible-operands', where: 'typer', bad_type_a: stringify(b), operator: '/', bad_type_b: stringify(a)}
            return {error: true, result}
        }
        else {
            s.push(new Typed.AtomicType('literal', 'real'))
            return {error: false, result: s}
        }
    }
    else {
        const result: Errors.MissingOperands = {reason: 'missing-operands', where: 'typer', operator: '/', required: 2}
        return {error: true, result}
    }
}

function logical (s: Typed.Type[], op: string): Failure<Errors.IncompatibleOperand | Errors.IncompatibleOperands | Errors.MissingOperands> | Success<Typed.Type[]> {
    if ((op == 'and' || op == 'or') && s.length >= 2) {
        const a = s.pop()
        const b = s.pop()

        const a_string = stringify(a)
        const b_string = stringify(b)

        const atomic_cond = a.kind == 'atomic' && b.kind == 'atomic'

        if (!(atomic_cond && a_string == 'logico' && b_string == 'logico')) {
            /**
             * Este error se detecta cuando se intenta comparar datos de tipos incompatibles
             * o cuando alguno de los operandos es un arreglo.
             */
            const result: Errors.IncompatibleOperands = {reason: 'incompatible-operands', where: 'typer', bad_type_a: stringify(b), operator: '/', bad_type_b: stringify(a)}
            return {error: true, result}
        }
        else {
            s.push(new Typed.AtomicType('literal', 'logico'))
            return {error: false, result: s}
        }
    }
    else if (op == 'not' && s.length == 1) {
        const a = s.pop()

        if (!(a.kind == 'atomic' && stringify(a) == 'logico')) {
            const result: Errors.IncompatibleOperand = {reason: 'incompatible-operand', where: 'typer', bad_type: stringify(a), operator: 'not'}
            return {error: true, result}
        }
        else {
            s.push(new Typed.AtomicType('literal', 'logico'))
            return {error: false, result: s}
        }
    }
    else {
        if (op == 'not') {
            const result: Errors.MissingOperands = {reason: 'missing-operands', where: 'typer', operator: 'not', required: 1}
            return {error: true, result}
        }
        else {
            const result: Errors.MissingOperands = {reason: 'missing-operands', where: 'typer', operator: op, required: 2}
            return {error: true, result}
        }
    }
}