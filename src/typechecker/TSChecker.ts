import {Typed, Failure, Success} from '../interfaces'
import {TypeError, MissingOperands, IncompatibleOperand, IncompatibleOperands, IncompatibleTypesError} from '../interfaces'

export default function check (p: Typed.Program): TypeError[] {
    let errors: TypeError[] = []

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

function check_statement (s: Typed.Statement): TypeError[] {
    switch (s.type) {
        case 'assignment':
            return check_assignment(s)
        default:
            console.log('hola')
            break
    }
}

function check_assignment (a: Typed.Assignment): TypeError[] {
    let errors: TypeError[] = []

    const inv_report = check_invocation(a.left)

    const exp_report = calculate_type(a.right)

    if (inv_report.error) {
        errors = errors.concat(inv_report.result)
    }

    if (exp_report.error) {
        errors = errors.concat(exp_report.result)
    }

    if (inv_report.error == false && exp_report.error == false) {
        if (!types_are_equal(inv_report.result, exp_report.result)) {
            /**
             * Revisar que la expresion a asignar sea del mismo tipo
             * que la variable a la cual se asigna, a menos que la
             * expresion sea de tipo entero y la variable de tipo real.
             */
            if ((inv_report.result as Typed.AtomicType).typename != 'real' || ((exp_report.result as Typed.AtomicType).typename != 'entero')) {
                const error: IncompatibleTypesError = {
                    reason: '@assignment-incompatible-types',
                    where: 'typechecker',
                    expected: stringify(inv_report.result),
                    received: stringify(exp_report.result)
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
function check_invocation(i: Typed.Invocation): Failure<TypeError[]>|Success<Typed.Type> {
    let errors: TypeError[] = []

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

function calculate_type(exp: Typed.ExpElement[]): Failure<TypeError[]>|Success<Typed.Type> {
    let stack: Typed.ExpElement[] = []
    let errors: TypeError[] = []

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
            case 'operator': {
                const op_report = operators[e.name](stack)
                if (op_report.error) {
                    errors = errors.concat(op_report.result)
                }
                else {
                    stack = op_report.result as Typed.ExpElement[]
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

/**
 * Los operadores se implementan como funciones que toman una pila,
 * desapilan tantos elementos como necesiten, operan con ellos,
 * apilan el resultado y devuelven la nueva pila.
 * 
 * Tambien pueden devolver un error en caso de que no haya suficientes
 * elementos en la pila o los tipos de estos no sean compatibles entre
 * si o con el operador.
 */
const operators: {[o:string]: (s: Typed.ExpElement[])=> Failure<TypeError>|Success<Typed.ExpElement[]>} = {
    plus: (s) => {
        const supported: string[] = ['entero', 'real']

        if (s.length >= 2) {
            const a: string = stringify(s.pop() as Typed.Type)
            const b: string = stringify(s.pop() as Typed.Type)

            /**
             * Hay arriba falta considerar el caso en el que una expresion
             * mal escrita hace que (al llamar a un operador) en la pila
             * haya otros operadores en el medio de los operandos...
             * 
             * Una expresion como "2 + *" causaria ese error...
             */

            if (supported.indexOf(a) == -1 || supported.indexOf(b) == -1 ) {
                /**
                 * ERROR: este operador no opera sobre el tipo de alguno de sus operandos
                 */

                if (supported.indexOf(a) == -1 && supported.indexOf(b) == -1) {
                    return {error: true, result: {reason: 'incompatible-operands', where: 'typechecker', bad_type_a: a, bad_type_b: b}}
                }
                else if (supported.indexOf(a) == -1) {
                    return  {error: true, result: {reason: 'incompatible-operand', where: 'typechecker', bad_type: a}}
                }
                else {
                    return  {error: true, result: {reason: 'incompatible-operand', where: 'typechecker', bad_type: b}}
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
            return {error: true, result: {reason: 'missing-operands', where: 'typechecker', operator: 'plus', required: 2}}
        }
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