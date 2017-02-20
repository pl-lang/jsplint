import {Typed, Failure, Success, Errors} from '../interfaces'
import {types_are_equal, stringify} from '../utility/helpers'

export default function check (p: Typed.Program): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    for (let mn in p.modules) {
        const mod = p.modules[mn]
        for (let s of mod.body) {
            const report = check_statement(s)
            if (report.length > 0) {
                errors = errors.concat(report)
            }
        }
    }

    return errors
}

function check_statement (s: Typed.Statement): Errors.TypeError[] {
    switch (s.type) {
        case 'assignment':
            return check_assignment(s)
        case 'call':
            {
                const report = check_call(s)
                return report.error ? report.result:[]
            }
        case 'if':
            return check_if(s)
        case 'while':
        case 'until':
            return check_simple_loop(s)
        case 'for':
            return check_for(s)
        case 'return':
            return check_return(s)
    }
}

function check_simple_loop (l: Typed.While | Typed.Until): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    if (!types_are_equal(l.typings.condition, new Typed.AtomicType('literal', 'logico'))) {
        const error: Errors.BadCondition = {
            reason: 'bad-condition',
            where: 'typechecker',
            received: stringify(l.typings.condition),
            pos: l.pos
        }

        errors.push(error)
    }

    for (let s of l.body) {
        const statement_errors = check_statement(s)

        if (statement_errors.length > 0) {
            errors = errors.concat(statement_errors)
        }
    }

    return errors
}

function check_for (f: Typed.For): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    const init_report = check_assignment(f.counter_init)

    if (init_report.length > 0) {
        errors = errors.concat(init_report)
    }

    if (!types_are_equal(f.counter_init.typings.left, new Typed.AtomicType('literal', 'entero'))) {
        const error: Errors.BadCounter = {
            reason: '@for-bad-counter',
            where: 'typechecker',
            received: stringify(f.counter_init.typings.left),
            pos: f.pos
        }

        errors.push(error)
    }

    if (!types_are_equal(f.typings.init_value, new Typed.AtomicType('literal', 'entero'))) {
        const error: Errors.BadInitValue = {
            reason: '@for-bad-init',
            where: 'typechecker',
            received: stringify(f.typings.init_value),
            pos: f.pos
        }

        errors.push(error)
    }

    if (!types_are_equal(f.typings.last_value, new Typed.AtomicType('literal', 'entero'))) {
        const error: Errors.BadLastValue = {
            reason: '@for-bad-last',
            where: 'typechecker',
            received: stringify(f.typings.last_value),
            pos: f.pos
        }

        errors.push(error)
    }

    for (let s of f.body) {
        const statement_errors = check_statement(s)

        if (statement_errors.length > 0) {
            errors = errors.concat(statement_errors)
        }
    }

    return errors
}

function check_return (r: Typed.Return): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    if (!types_are_equal(r.typings.actual, r.typings.expected)) {
        const error: Errors.BadReturn = {
            reason: 'bad-return',
            where: 'typechecker',
            declared: stringify(r.typings.expected),
            received: stringify(r.typings.actual),
            pos: r.pos
        }

        errors.push(error)
    }

    return errors
}

function check_if (i: Typed.If): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    if (!types_are_equal(i.typings.condition, new Typed.AtomicType('literal', 'logico'))) {
        const error: Errors.BadCondition = {
            reason: 'bad-condition',
            where: 'typechecker',
            received: stringify(i.typings.condition),
            pos: i.pos
        }

        errors.push(error)
    }

    for (let s of i.true_branch) {
        const statement_errors = check_statement(s)

        if (statement_errors.length > 0) {
            errors = errors.concat(statement_errors)
        }
    }

    for (let s of i.false_branch) {
        const statement_errors = check_statement(s)

        if (statement_errors.length > 0) {
            errors = errors.concat(statement_errors)
        }
    }

    return errors
}

function check_call (c: Typed.Call): Failure<Errors.TypeError[]>|Success<Typed.AtomicType> {
    /**
     * Para que la llamada no contenga errores:
     *  - Tiene que haber tantos argumentos como parametros
     *  - Sus argumentos no deben contener errores
     *  - Los tipos de sus argumentos y sus parametros deben coincidir
     */
    if (c.name == 'escribir' || c.name == 'escribir_linea' || c.name == 'leer') {
        return check_io(c)
    }
    else {
        let errors: Errors.TypeError[] = []

        /**
         * Ver si la cantidad de argumentos coincide con la cantidad
         * de parametros
         */
        if (c.typings.args.length != c.typings.parameters.length) {
            const error: Errors.WrongArgAmount = {
                expected: c.typings.parameters.length,
                received: c.typings.args.length,
                name: c.name,
                reason: '@call-wrong-arg-amount',
                where: 'typechecker',
                pos: c.pos
            }

            errors.push(error)
        }

        /**
         * Comparar los tipos de los argumentos con los
         * de los parametros
         */
        const arg_types = c.typings.args.map((a, i) => {return {index: i, type: a}})

        for (let arg of arg_types) {
            /**
             * Revisar que la expresion a asignar sea del mismo tipo
             * que la variable a la cual se asigna, a menos que la
             * expresion sea de tipo entero y la variable de tipo real.
             */
            const param_type = c.typings.parameters[arg.index]
            const param = c.parameters[arg.index]
            const cond_a = param_type.kind == 'atomic' || arg.type.kind == 'atomic'
            const cond_b = (param_type as Typed.AtomicType).typename == 'real' && (arg.type as Typed.AtomicType).typename == 'entero'

            if (!(types_are_equal(arg.type, param_type) || (cond_a && cond_b))) {
                const error: Errors.IncompatibleArgument = {
                    reason: '@call-incompatible-argument',
                    name: c.name,
                    where: 'typechecker',
                    expected: stringify(param_type),
                    received: stringify(arg.type),
                    index: arg.index + 1,
                    pos: c.pos
                }
                errors.push(error)
            }

            /**
             * Si el parametro se toma por referencia hay que revisar que este recibiendo como argumento
             * la invocacion de una variable/arreglo
             */
            if (param.by_ref) {
                if (arg.type.represents != 'invocation') {
                    /**
                     * ERROR: se esta recibiendo un valor literal en un parametro por referencia
                     */
                    const error: Errors.BadRefArg = {
                        reason: '@call-bad-ref-arg',
                        where: 'typechecker',
                        /**
                         * Tipo del parametro en cuestion
                         */
                        param_expected: stringify(param_type),
                        /**
                         * Nombre del parametro en cuestion
                         */
                        param_name: param.name,
                        /**
                         * Nombre del modulo al que pertenece
                         */
                        module: c.name,
                        /**
                         * Tipo del valor literal recibido como argumento
                         */
                        received: stringify(arg.type),
                        /**
                         * Indice (en la lista de parametros del modulo)
                         */
                        index: arg.index,
                        pos: c.pos
                    }
                    errors.push(error)
                }
            }
        }

        if (errors.length > 0) {
            return {error: true, result: errors}
        }
        else {
            return {error: false, result: c.typings.return}
        }
    }
}

function check_io (c: Typed.Call): Failure<Errors.TypeError[]>|Success<Typed.AtomicType> {
    /**
     * Para las tres funciones (leer, escribir, y escribir_linea) hay
     * que revisar que los argumentos no tengan errores y ademas hay
     * que revisar que esos argumentos puedan reducirse a tipos
     * atomicos o cadenas. 
     */
    let errors: Errors.TypeError[] = []

    for (let i = 0; i < c.typings.args.length; i++) {
        const type = c.typings.args[i]
        /**
         * condiciones para el siguiente error
         */
        const cond_a = type.kind == 'atomic' && (type as Typed.AtomicType).typename == 'ninguno'
        const cond_b = type.kind != 'atomic' && !(type instanceof Typed.StringType)

        if (cond_a || cond_b) {
            const e: Errors.BadWriteArg = {
                index: i,
                reason: 'bad-write-arg',
                received: stringify(type),
                where: 'typechecker',
                name: c.name,
                pos: c.pos
            }
            errors.push(e)
        }
        else if (c.name == 'leer' && type.represents != 'invocation') {
            const e: Errors.BadReadArg = {
                reason: '@read-bad-arg',
                where: 'typechecker',
                index: i,
                pos: c.pos
            }
            errors.push(e)
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: new Typed.AtomicType('literal', 'ninguno')}
    }
}

function check_assignment (a: Typed.Assignment): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    const inv_report = check_invocation(a.left)

    if (inv_report.error) {
        errors = errors.concat(inv_report.result)
    }

    if (inv_report.error == false) {
        if (inv_report.result instanceof Typed.StringType && a.typings.right instanceof Typed.StringType) {
            /**
             * Si se esta asignando una cadena a un vector solo hay que
             * revisar que la cadena quepa. 
             */
            if (!(inv_report.result.length >= a.typings.right.length)) {
                const error: Errors.LongString = {
                    vector_length: inv_report.result.length,
                    string_length: a.typings.right.length,
                    name: a.left.name,
                    reason: '@assignment-long-string',
                    type: stringify(inv_report.result),
                    where: 'typechecker',
                    pos: a.pos
                }

                errors.push(error)
            }
        }
        else {
            /**
             * Revisar que la expresion a asignar sea del mismo tipo
             * que la variable a la cual se asigna, a menos que la
             * expresion sea de tipo entero y la variable de tipo real.
             */
            const cond_a = inv_report.result.kind == 'atomic' && a.typings.right.kind == 'atomic'
            const cond_b = (inv_report.result as Typed.AtomicType).typename == 'real' && (a.typings.right as Typed.AtomicType).typename == 'entero'

            if (!(types_are_equal(inv_report.result, a.typings.right) || (cond_a && cond_b))) {
                const error: Errors.IncompatibleTypes = {
                    reason: '@assignment-incompatible-types',
                    where: 'typechecker',
                    expected: stringify(inv_report.result),
                    received: stringify(a.typings.right),
                    pos: a.pos
                }

                errors.push(error)
            }
        }
    }

    return errors
}

/**
 * check_invocation
 * busca errores en los indices de una invocacion.
 * Si no hay errores devuelve el tipo del valor invocado.
 */
function check_invocation(i: Typed.Invocation): Failure<Errors.TypeError[]>|Success<Typed.Type> {
    let errors: Errors.TypeError[] = []
    const entero = new Typed.AtomicType('literal', 'entero')
    let j = 0;

    for (let index_type of i.typings.indexes) {
        if (!types_are_equal(index_type, entero)) {
            const error: Errors.BadIndex = {
                at: j,
                name: i.name,
                reason: '@invocation-bad-index',
                received: stringify(index_type),
                where: 'typechecker'
            }

            errors.push(error)
        }
        else {
            j++
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: i.typings.type}
    }
}