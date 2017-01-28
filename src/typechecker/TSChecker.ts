import {Typed, Failure, Success, Errors} from '../interfaces'

export default function check (p: Typed.Program): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    for (let mn in p) {
        const mod = p[mn]
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

    const condition = calculate_type(l.condition)

    if (condition.error) {
        errors = errors.concat(condition.result)
    }
    else {
        if (!types_are_equal(condition.result as Typed.Type, new Typed.AtomicType('logico'))) {
            const error: Errors.BadCondition = {
                reason: 'bad-condition',
                where: 'typechecker',
                received: stringify(condition.result as Typed.Type)
            }

            errors.push(error)
        }
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

    const counter = check_invocation(f.counter_init.left)

    if (counter.error) {
        errors = errors.concat(counter.result)
    }
    else {
        if (!types_are_equal(counter.result as Typed.Type, new Typed.AtomicType('entero'))) {
            const error: Errors.BadCounter = {
                reason: '@for-bad-counter',
                where: 'typechecker',
                received: stringify(counter.result as Typed.Type)
            }

            errors.push(error)
        }
    }

    const init_v = calculate_type(f.counter_init.right)

    if (init_v.error) {
        errors = errors.concat(init_v.result)
    }
    else {
        if (!types_are_equal(init_v.result as Typed.Type, new Typed.AtomicType('entero'))) {
            const error: Errors.BadInitValue = {
                reason: '@for-bad-init',
                where: 'typechecker',
                received: stringify(init_v.result as Typed.Type)
            }

            errors.push(error)
        }
    }

    const last_v = calculate_type(f.counter_init.right)

    if (last_v.error) {
        errors = errors.concat(last_v.result)
    }
    else {
        if (!types_are_equal(last_v.result as Typed.Type, new Typed.AtomicType('entero'))) {
            const error: Errors.BadLastValue = {
                reason: '@for-bad-last',
                where: 'typechecker',
                received: stringify(last_v.result as Typed.Type)
            }

            errors.push(error)
        }
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

    const exp = calculate_type(r.actual)

    if (exp.error) {
        errors = exp.result
    }
    else {
        if (!types_are_equal(exp.result as Typed.Type, r.expected)) {
            const error: Errors.BadReturn = {
                reason: 'bad-return',
                where: 'typechecker',
                declared: stringify(r.expected),
                received: stringify(exp.result as Typed.Type)
            }

            errors.push(error)
        }
    }

    return errors
}

function check_if (i: Typed.If): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    const condition = calculate_type(i.condition)

    if (condition.error) {
        errors = errors.concat(condition.result)
    }
    else {
        if (!types_are_equal(condition.result as Typed.Type, new Typed.AtomicType('logico'))) {
            const error: Errors.BadCondition = {
                reason: 'bad-condition',
                where: 'typechecker',
                received: stringify(condition.result as Typed.Type)
            }

            errors.push(error)
        }
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
        if (c.argtypes.length != c.paramtypes.length) {
            /**
             * meter el error en errors
             */
        }

        /**
         * Calcular el tipo de cada argumento
         */
        const argtypes: Array<{index:number, type:Typed.Type}> = []
        for (let i = 0; i < c.argtypes.length; i++) {
            const report = calculate_type(c.argtypes[i])
            if (report.error) {
                errors = errors.concat(errors)
            }
            else {
                argtypes.push({index: i, type: report.result as Typed.Type})
            }
        }

        /**
         * Comparar los tipos de los argumentos con los
         * de los parametros
         */
        for (let arg of argtypes) {
            /**
             * Revisar que la expresion a asignar sea del mismo tipo
             * que la variable a la cual se asigna, a menos que la
             * expresion sea de tipo entero y la variable de tipo real.
             */
            const param = c.paramtypes[arg.index]
            const cond_a = param.kind == 'atomic' || arg.type.kind == 'atomic'
            const cond_b = (param as Typed.AtomicType).typename == 'real' && (arg.type as Typed.AtomicType).typename == 'entero'

            if (!(types_are_equal(arg.type, param) || (cond_a && cond_b))) {
                const error: Errors.IncompatibleArgument = {
                    reason: '@call-incompatible-argument',
                    where: 'typechecker',
                    expected: stringify(param),
                    received: stringify(arg.type),
                    index: arg.index + 1
                }
                errors.push(error)
            }
        }

        if (errors.length > 0) {
            return {error: true, result: errors}
        }
        else {
            return {error: false, result: c.datatype}
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

    for (let i = 0; i < c.argtypes.length; i++) {
        const report = calculate_type(c.argtypes[i])
        if (report.error) {
            errors = errors.concat(errors)
        }
        else {
            const type = report.result as Typed.Type

            /**
             * condiciones para el siguiente error
             */
            const cond_a = type.kind == 'atomic' && (type as Typed.AtomicType).typename == 'ninguno'
            const cond_b = type.kind != 'atomic' && !(type instanceof Typed.StringType)

            if (cond_a || cond_b) {
                const e: Errors.BadIOArgument = {
                    index: i,
                    reason: 'bad-io-argument',
                    received: stringify(type),
                    where: 'typechecker'
                }

                errors.push(e)
            }
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: new Typed.AtomicType('ninguno')}
    }
}

function check_assignment (a: Typed.Assignment): Errors.TypeError[] {
    let errors: Errors.TypeError[] = []

    const inv_report = check_invocation(a.left)

    const exp_report = calculate_type(a.right)

    if (inv_report.error) {
        errors = errors.concat(inv_report.result)
    }

    if (exp_report.error) {
        errors = errors.concat(exp_report.result)
    }

    if (inv_report.error == false && exp_report.error == false) {
        /**
         * Revisar que la expresion a asignar sea del mismo tipo
         * que la variable a la cual se asigna, a menos que la
         * expresion sea de tipo entero y la variable de tipo real.
         */
        const cond_a = inv_report.result.kind == 'atomic' && exp_report.result.kind == 'atomic'
        const cond_b = (inv_report.result as Typed.AtomicType).typename == 'real' && (exp_report.result as Typed.AtomicType).typename == 'entero'

        if (!(types_are_equal(inv_report.result, exp_report.result) || (cond_a && cond_b))) {
            const error: Errors.IncompatibleTypes = {
                reason: '@assignment-incompatible-types',
                where: 'typechecker',
                expected: stringify(inv_report.result),
                received: stringify(exp_report.result)
            }

            errors.push(error)
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

    for (let index of i.indextypes) {
        const exp_report = calculate_type(index)
        if (exp_report.error) {
            errors = errors.concat(exp_report.result)
        }
    }

    if (errors.length > 0) {
        return {error: true, result: errors}
    }
    else {
        return {error: false, result: i.datatype}
    }
}

/**
 * calculate_type
 * "ejecuta" una expresion de tipos y calcula el tipo resultante
 * 
 * Por ejemplo: entero + entero = entero; entero + real = real
 */

function calculate_type(exp: Typed.ExpElement[]): Failure<Errors.TypeError[]>|Success<Typed.Type> {
    let stack: Typed.Type[] = []
    let errors: Errors.TypeError[] = []

    for (let e of exp) {
        switch (e.type) {
            case 'type':
                stack.push(e)
            break
            case 'invocation': {
                const inv_report = check_invocation(e)
                if (inv_report.error) {
                    errors = errors.concat(inv_report.result)
                }
                else {
                    stack.push(inv_report.result as Typed.Type)
                }
            }
            break
            case 'call':
                {
                    if (e.name == 'escribir' || e.name == 'escribir_linea' || e.name == 'leer') {
                        /**
                         * USUARIO MALO! COMO VAS A USAR UNA DE ESAS FUNCIONES EN UNA EXPRESION?!1!
                         */
                    }
                    else {
                        const report = check_call(e)
                        if (report.error) {
                            errors = errors.concat(report.result)
                        }
                        else {
                            stack.push(report.result as Typed.AtomicType)
                        }
                    }
                }
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

function operate (s: Typed.Type[], op: string) {
    switch (op) {
        case 'plus':
        case 'times':
        case 'minus':
        case 'power':
            return plus_times(s, op)
        case 'minor':
        case 'minor-eq':
        case 'major':
        case 'major-eq':
        case 'equal':
        case 'different':
            return comparison(s, op)
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

function plus_times (s: Typed.Type[], op: string): Failure<Errors.TypeError>|Success<Typed.Type[]> {
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
                const result: Errors.IncompatibleOperands = {reason: 'incompatible-operands', where: 'typechecker', bad_type_a: a, bad_type_b: b, operator: op}
                return {error: true, result}
            }
            else if (supported.indexOf(a) == -1) {
                const result: Errors.IncompatibleOperand = {reason: 'incompatible-operand', where: 'typechecker', bad_type: a, operator: op}
                return  {error: true, result}
            }
            else {
                const result: Errors.IncompatibleOperand = {reason: 'incompatible-operand', where: 'typechecker', bad_type: b, operator: op}
                return  {error: true, result}
            }
        }

        switch (a) {
            case 'entero':
                switch (b) {
                    case 'entero':
                        s.push(new Typed.AtomicType('entero'))
                        break
                    case 'real':
                        s.push(new Typed.AtomicType('real'))
                        break
                }
                break
            case 'real':
                s.push(new Typed.AtomicType('real'))
                break
        }

        return {error: false, result: s}
    }
    else {
        const result: Errors.MissingOperands = {reason: 'missing-operands', where: 'typechecker', operator: op, required: 2}
        return {error: true, result}
    }
}

function comparison (s: Typed.Type[], op: string): Failure<Errors.BadComparisonOperands|Errors.MissingOperands>|Success<Typed.ExpElement[]> {
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
            const result: Errors.BadComparisonOperands = {reason: '@comparison-bad-operands', where: 'typechecker', left: stringify(b), right: stringify(a)}
            return {error: true, result}
        }
        else {
            s.push(new Typed.AtomicType('logico'))
            return {error: false, result: s}
        }
    }
    else {
        const result: Errors.MissingOperands = {reason: 'missing-operands', where: 'typechecker', operator: op, required: 2}
        return {error: true, result}
    }
}

function types_are_equal (a: Typed.Type, b: Typed.Type): boolean {
    if (a.kind == b.kind) {
        switch (a.kind) {
            case 'array':
                if ((a as Typed.ArrayType).length == (b as Typed.ArrayType).length) {
                    return types_are_equal ((a as Typed.ArrayType).cell_type, (b as Typed.ArrayType).cell_type)
                }
                else {
                    return false
                }
            case 'atomic':
                return (a as Typed.AtomicType).typename == (b as Typed.AtomicType).typename
        }
    }
    else {
        return false
    }
}

function stringify (type: Typed.Type): string {
  if (type.kind == 'array') {
    let dimensions = ''
    let ct: Typed.Type = type
    while (ct.kind == 'array') {
      dimensions += (ct as Typed.ArrayType).length
      if ((ct as Typed.ArrayType).cell_type.kind == 'array') {
          dimensions += ', '
      }
      ct = (ct as Typed.ArrayType).cell_type
    }
    const atomic = (ct as Typed.AtomicType).typename
    return `${atomic}[${dimensions}]`
  }
  else {
    return (type as Typed.AtomicType).typename
  }
}