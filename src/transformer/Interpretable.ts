'use strict'

import * as S2 from '../interfaces/Stage2'

import * as P from '../interfaces/Program'

import {ISuccess as Success} from '../interfaces/Utility'

import {drop, arr_counter, arr_counter_inc, arr_counter_dec, arr_minor, arr_major, arr_equal} from '../utility/helpers'

import {ExpElement, OperatorElement, LiteralValue, InvocationValue, Return} from '../interfaces/ParsingInterfaces'

export default function transform (ast: S2.AST) : Success<P.Program> {
    const result = {
        entry_point: null,
        modules: {},
        local_variables: {}
    } as P.Program

    const new_main = transform_main(ast.modules.main)

    result.entry_point = new_main

    for (let name in ast.modules.user_modules) {
        const module = transform_module(ast.modules.user_modules[name], ast)
        result.modules[name] = module
    }

    result.local_variables = ast.local_variables

    return {error: false, result}
}

function transform_main (old_module: S2.Main) : P.Statement {
    return transform_body(old_module.body)
}

function transform_module (old_module: S2.Module, ast: S2.AST) : P.Module {
    /**
     * Copio los parametros
     */
    const parameters: {[p: string]: P.Parameter} = {}
    for (let par of old_module.parameters) {
        const {name, by_ref, is_array, dimensions} = par
        parameters[name] = {name, by_ref, is_array}
    }

    /**
     * Inicializo los parametros. Tienen que ser inicializados
     * de atras para adelante (del ultimo al primero).
     */
    let first_init: P.Statement
    let last_statement: P.Statement
    for (let i = old_module.parameters.length - 1; i >= 0; i--) {
        const param = old_module.parameters[i]
        const fake_inv: S2.InvocationValue = {
            dimensions: param.dimensions,
            indexes: [],
            is_array: param.is_array,
            name: param.name,
            type: 'invocation'
        }
        const assignment = create_assignment(fake_inv)
        if (i == old_module.parameters.length - 1) {
            first_init = assignment
        }
        else {
            last_statement.exit_point = assignment
        }
        last_statement = P.get_last(assignment)
    }

    const body_entry = transform_body(old_module.body)

    /**
     * Enlazar la ultima inicializacion al primer enunciado del cuerpo
     */
    last_statement.exit_point = body_entry

    const new_module: P.Module = {
        entry_point: first_init,
        name: old_module.name,
        parameters: parameters
    }

    return new_module
}

function transform_if (statement: S2.If) : P.Statement {
    /**
     * La condicion del if debe insertarse antes del propio if
     */
    const entry = transform_expression(statement.condition)

    /**
     * Ultimo enunciado de la condicion del if
     */
    const last_statement = P.get_last(entry)

    const true_entry = transform_body(statement.true_branch)
    const false_entry = transform_body(statement.false_branch)

    const sif = new P.If(true_entry, false_entry)

    /**
     * Hacer que la evaluacion de la condicion venga seguida del if
     */

    last_statement.exit_point = sif

    return entry
}

function transform_while (statement: S2.While) : P.Statement {
    /**
     * condicion
     * bucle
     * condicion
     */
    const condition_entry = transform_expression(statement.condition)
    const cond_last_st = P.get_last(condition_entry)

    const loop_body = transform_body(statement.body)
    const body_last_st = P.get_last(loop_body)

    const swhile = new P.While(loop_body)

    cond_last_st.exit_point = swhile

    body_last_st.exit_point = condition_entry

    return condition_entry
}

function transform_until (statement: S2.Until) : P.Statement {
    const body = transform_body(statement.body)
    const body_last_st = P.get_last(body)

    const condition = transform_expression(statement.condition)
    /**
     * La condicion del bucle se evalua luego del ultimo enunciado
     * que este contiene.
     */
    body_last_st.exit_point = condition

    const last_st_condition = P.get_last(condition)

    const suntil = new P.Until(body)

    last_st_condition.exit_point = suntil

    return body
}

function transform_for (statement: S2.For) : P.Statement {
    /**
     * Los bucles para tienen la siguiente estructura
     * 
     * para <contador> <- <valor inicial> hasta <valor tope>
     *      <enunciados>
     * finpara
     * 
     * El bucle finaliza cuando la variable contador supera al
     * valor tope.
     */

    /**
     * Los bucles 'para' se convierten en bucles 'mientras'.
     * Eso implica que hay crear el enunciado que inicializa
     * la variable del for, y agregar el enunciado de
     * incremento y el de comparacion al final del cuerpo
     * del while
     */

    /**
     * Este es el enunciado de asignacion que inicializa el contador.
     */
    const init = transform_assignment(statement.counter_init)
    const init_last = P.get_last(init)

    /**
     * Ese debe engancharse con la condicion del while.
     * La condicion es <contador> <= <tope>
     */
    const left: S2.InvocationInfo = statement.counter_init.left
    const counter_invocation: InvocationValue = {type:'invocation', name:left.name, is_array:left.is_array, indexes:left.indexes}

    const condition_exp: ExpElement[] = [counter_invocation, ...statement.last_value, {type:'operator', name:'minor-eq'}]
    const condition_entry = transform_expression(condition_exp)
    const conditon_last = P.get_last(condition_entry)

    /**
     * A la evaluacion de la condicion le sigue el cuerpo del bucle
     */
    const body = transform_body(statement.body)
    const body_last = P.get_last(body)

    /**
     * Y al cuepor del bucle le sigue el incremento del contador
     */
    const increment_value: LiteralValue = {type:'literal', value:1}
    const right: ExpElement[] = [counter_invocation, increment_value, {type:'operator', name:'plus'}]

    /**
     * Enunciado S2 del incremento
     */
    const assingment: S2.Assignment = {
        left: left,
        right: right,
        type: 'assignment'
    }

    /**
     * Ahora ese enunciado de S2 debe convertirse en uno de Program
     */
    const incremement_entry = transform_assignment(assingment)
    const increment_last = P.get_last(incremement_entry)

    /**
     * Y ahora hay que enganchar todo:
     * -    inicializacion
     * -    condicion
     * -    enunciado mientras (aca se decide si entrar o no al cuerpo)
     * -    cuerpo
     * -    incremento
     * -    condicion
     */

    const swhile = new P.While(body)

    init_last.exit_point = condition_entry
    conditon_last.exit_point = swhile
    body_last.exit_point = incremement_entry
    increment_last.exit_point = condition_entry

    return init
}

function transform_call (call: S2.ModuleCall) : P.Statement {
    /**
     * Para transformar las llamadas solo hay que encadenar
     * la evaluacion de sus argumentos (en el orden en que aparecen)
     * con el Statement de llamada.
     */
    const first_arg: P.Statement = transform_expression(call.args[0])
    let last_statement = P.get_last(first_arg)

    for (let i = 0; i < call.args.length - 1; i++) {
        const next_arg = transform_expression(call.args[i + 1])
        last_statement.exit_point = next_arg
        last_statement = P.get_last(next_arg)
    }

    const ucall = new P.UserModuleCall(call.name, call.args.length)

    last_statement.exit_point =  ucall

    return first_arg
}

function transform_write (wc: S2.WriteCall) : P.Statement {
    /**
     * Escribir es un procedimiento que toma solo un argumento,
     * en realidad.
     * Hay que hacer una llamada por cada argumento evaluado.
     */
    const first_arg: P.Statement = transform_expression(wc.args[0])
    let last_statement = P.get_last(first_arg)

    const escribir_call = new P.WriteCall()

    last_statement.exit_point = escribir_call
    last_statement = escribir_call

    for (let i = 0; i < wc.args.length - 1; i++) {
        const next_arg = transform_expression(wc.args[i + 1])
        const next_arg_last = P.get_last(next_arg)
        last_statement.exit_point = next_arg
        const wcall = new P.WriteCall()
        next_arg_last.exit_point = wcall
        last_statement = wcall
    }

    return first_arg
}

function transform_read (rc: S2.ReadCall) : P.Statement {
    /**
     * Leer tambien es un procedimiento de un solo argumento.
     * Por cada argumento hay que crear una llamada a leer y una asignacion.
     * La llamada a leer inserta el valor leido al tope de la pila.
     */
    let first_call: P.Statement
    let current_call: P.Statement
    let last_statement: P.Statement
    let current_var: S2.InvocationValue
    for (let i = 0; i < rc.args.length; i++) {
        /**
         * El type assert es correcto porque esta garantizado por
         * el TypeChecker que los argumentos de un llamado a leer
         * son todos InvocationValues. O va a estar garantizado...
         */
        current_var = rc.args[i][0] as S2.InvocationValue

        const lcall = new P.ReadCall(current_var.name)

        if (i == 0) {
            first_call = lcall
        }
        else {
            last_statement.exit_point = lcall
        }

        const target_assignment = create_assignment(current_var)

        lcall.exit_point =  target_assignment
        last_statement = P.get_last(target_assignment)
    }

    return first_call
}

function create_assignment (v: S2.InvocationValue) : P.Statement {
    if (v.is_array) {
        if (v.dimensions.length > v.indexes.length) {
            /**
             * "grados de libertad"
             */
            const g = v.dimensions.length - v.indexes.length
            /**
             * tamaño de las dimensiones cuyos indices van a ir variando
             */
            const dv = drop(v.indexes.length, v.dimensions)
            
            let first_index: P.Statement
            let last_statement: P.Statement
            for (let i = arr_counter(g, 1); arr_minor(i, dv) || arr_equal(i, dv); arr_counter_inc(i, dv, 1)) {
                /**
                 * Los indices que no fueron proprocionados seran completados con los del
                 * contador `i`
                 */
                const missing_indexes: ExpElement[][] = i.map(create_literal_number_exp)
                const final_indexes = [...v.indexes, ...missing_indexes]

                for (let j = 0; j < final_indexes.length; j++) {
                    const index_exp = transform_expression(final_indexes[j])

                    /**
                     * Si esta es la primer iteracion de ambos bucles...
                     */
                    if (arr_equal(i, arr_counter(i.length, 1))) {
                        first_index = index_exp
                    }
                    else {
                        last_statement.exit_point = index_exp
                    }

                    last_statement = P.get_last(index_exp)

                    const assignment = new P.AssignV(final_indexes.length, v.dimensions, v.name)

                    last_statement.exit_point = assignment

                    last_statement = assignment
                }
            }

            return first_index
        }
        else {
            const first_index = transform_expression(v.indexes[0])
            let last_statement = P.get_last(first_index)
            for (let i = 0; i < v.indexes.length - 1; i++) {
                const next_index = transform_expression(v.indexes[i + 1])
                last_statement.exit_point =  next_index
                last_statement = P.get_last(next_index)
            }

            const assignment = new P.AssignV(v.indexes.length, v.dimensions, v.name)

            last_statement.exit_point = assignment

            return first_index
        }
    }
    else {
        const assignment = new P.Assign(v.name)

        return assignment
    }
}

function create_literal_number_exp (n: number) : LiteralValue[] {
    return [{type: 'literal', value: n}]
}

function transform_return (ret: Return) : P.Statement {
    /**
     * Para transformar 'retornar' solo hay que transformar
     * su expresion. Una vez que se evalue eso, el retorno de
     * la funcion queda al tope de la pila.
     */
    return transform_expression(ret.expression)
}

function transform_body (body: S2.Statement[]) : P.Statement {
    if (body.length > 0) {
        const entry_point: P.Statement = transform_statement(body[0])

        let last_statement: P.Statement = P.get_last(entry_point)

        for (let i = 0; i < body.length - 1; i++) {
            const next_statement = transform_statement(body[i+1])
            last_statement.exit_point = next_statement
            last_statement = P.get_last(next_statement)
        }

        return entry_point
    }
    else {
        return null
    }
}

function transform_statement (statement: S2.Statement) : P.Statement {
    switch (statement.type) {
        case 'assignment':
            return transform_assignment(statement)
        case 'if':
            return transform_if(statement)
        case 'while':
            return transform_while(statement)
        case 'until':
            return transform_until(statement)
        case 'for':
            return transform_for(statement)
        case 'call':
            switch (statement.name) {
                case 'leer':
                    return transform_read(statement as S2.ReadCall)
                case 'escribir':
                    return transform_write(statement as S2.WriteCall)
                default:
                    return transform_call(statement as S2.ModuleCall)
            }
        case 'return':
            return transform_return(statement)
    }
}

function transform_assignment (assignment: S2.Assignment) : P.Statement {
    /**
     * Primer enunciado de la evaluacion de la expresion que se debe asignar
     */
    const entry_point = transform_expression(assignment.right)

    /**
     * Este enunciado es el que finalmente pone el valor de la expresion en la
     * pila. Seguido de este va el enunciado de asignacion.
     */
    let last_statement = P.get_last(entry_point)
    
    if (assignment.left.dimensions.length > 0 && assignment.left.indexes.length < assignment.left.dimensions.length) {
        /**
         * Asignacion vectorial: copiar los contenidos de un vector a otro.
         * En este caso esta garantizado que del lado derecho de la asignacion hay un vector
         * con menos indices que dimensiones.
         * Hay que hacer una lista de enunciados que metan los valores que deben copiarse
         * seguidos de los indices de la celda donde deben ser insertados y, por ultimo, el
         * enunciado de asignacion vectorial. Las expresiones de los indices que fueron provistos
         * para el vector de la derecha deben evaluarse y ponerse al tope de la pila.
         * Los indices que falten deben rellenarse con numeros del 1...n donde n es el tamaño de
         * la dimension faltante.
         */
        for (let i = 0; i < assignment.left.indexes.length; i++) {
            const index_entry = transform_expression(assignment.left.indexes[i])
            const index_last = P.get_last(index_entry)
            /**
             * Luego de apilar el valor de la expresion, hay que apilar el valor del indice
             */
            last_statement.exit_point = index_entry
            /**
             * Luego hay que hacer la asignacion
             */

        }
    }
    else {
        /**
         * Asignacion normal: hay que copiar un valor a una variable (o una celda de un vector).
         * Para hacer eso hay que poner la expresion que se va a asignar en la pila y luego hacer
         * un enunciado de asignacion.
         * 
         * Si la asignacion es a una celda de un vector, primero hay que la expresion a asignar
         * en la pila, luego los indices de la celda, y por ultimo el enunciado de asignacion.
         */
        if (assignment.left.is_array) {
            const v = assignment.left

            const first_index = transform_expression(v.indexes[0])
            let index_last_st = P.get_last(first_index)

            for (let i = 0; i < v.indexes.length - 1; i++) {
                let next_index = transform_expression(v.indexes[i + 1])
                index_last_st.exit_point = next_index
                index_last_st = P.get_last(next_index) 
            }
            const assignv = new P.AssignV(v.indexes.length, v.dimensions, v.name)

            index_last_st.exit_point = assignv
            last_statement.exit_point = first_index
        }
        else {
            const assign = new P.Assign(assignment.left.name)
            last_statement.exit_point = assign
        }
    }

    return entry_point
}

function transform_invocation (i: S2.InvocationValue) : P.Statement {
    if (i.is_array) {
        if (i.dimensions.length > i.indexes.length) {
            /**
             * "grados de libertad"
             */
            const g = i.dimensions.length - i.indexes.length
            /**
             * tamaño de las dimensiones cuyos indices van a ir variando
             */
            const dv = drop(i.indexes.length, i.dimensions)
            /**
             * el indice mas pequeño posible
             */
            const smallest_index = arr_counter(g, 1)
            
            let first_index: P.Statement
            let last_statement: P.Statement
            /**
             * dv.slice(0) hace una copia de dv
             */
            for (let j = dv.slice(0); arr_major(j, smallest_index) || arr_equal(j, smallest_index); arr_counter_dec(j, dv)) {
                /**
                 * Los indices que no fueron proprocionados seran completados con los del
                 * contador `i`
                 */
                const missing_indexes: ExpElement[][] = j.map(create_literal_number_exp)
                const final_indexes = [...i.indexes, ...missing_indexes]

                for (let k = 0; k < final_indexes.length; k++) {
                    const index_exp = transform_expression(final_indexes[k])

                    /**
                     * Si esta es la primer iteracion de ambos bucles...
                     */
                    if (arr_equal(j, dv)) {
                        first_index = index_exp
                    }
                    else {
                        last_statement.exit_point = index_exp
                    }

                    last_statement = P.get_last(index_exp)

                    const invocation = new P.GetV(final_indexes.length, i.dimensions, i.name)

                    last_statement.exit_point = invocation

                    last_statement = invocation
                }
            }

            return first_index
        }
        else {
            const first_index = transform_expression(i.indexes[0])
            let last_statement = P.get_last(first_index)
            for (let j = 1; j < i.indexes.length; j++) {
                const next_index = transform_expression(i.indexes[j])
                last_statement.exit_point = next_index
                last_statement = P.get_last(next_index)
            }
            
            const getv = new P.GetV(i.indexes.length, i.dimensions, i.name)

            last_statement.exit_point = getv

            return first_index
        }
    }
    else {
        const geti = new P.Get(i.name)

        return geti
    }
}

function transform_expression (expression: ExpElement[]) : P.Statement {
    const statements = expression.map(transform_exp_element)
    const entry = statements[0]
    let last_statement: P.Statement = P.get_last(entry)
    for (let i = 0; i < statements.length - 1; i++) {
        last_statement.exit_point = statements[i + 1]
        last_statement = P.get_last(statements[i + 1])
    }
    
    return entry
}

function transform_exp_element (element: ExpElement) : P.Statement {
  switch (element.type) {
    case 'operator':
      switch ((element as OperatorElement).name) {
        case 'times':
            return new P.Operation(P.StatementKinds.Times)
        case 'slash':
            return new P.Operation(P.StatementKinds.Slash)
        case 'power':
            return new P.Operation(P.StatementKinds.Power)
        case 'div':
            return new P.Operation(P.StatementKinds.Div)
        case 'mod':
            return new P.Operation(P.StatementKinds.Mod)
        case 'minus':
            return new P.Operation(P.StatementKinds.Minus)
        case 'plus':
            return new P.Operation(P.StatementKinds.Plus)
        case 'minor':
            return new P.Operation(P.StatementKinds.Minor)
        case 'minor-eq':
            return new P.Operation(P.StatementKinds.MinorEq)
        case 'major':
            return new P.Operation(P.StatementKinds.Major)
        case 'major-eq':
            return new P.Operation(P.StatementKinds.MajorEq)
        case 'equal':
            return new P.Operation(P.StatementKinds.Equal)
        case 'not':
            return new P.Operation(P.StatementKinds.Not)
        case 'different':
            return new P.Operation(P.StatementKinds.Different)
        case 'and':
            return new P.Operation(P.StatementKinds.And)
        case 'or':
            return new P.Operation(P.StatementKinds.Or)
      }
    case 'literal':
        return new P.Push((element as LiteralValue).value)
    case 'invocation':
        return transform_invocation(element as S2.InvocationValue)
    case 'call':
        /**
         * Este type assert no causa problemas porque element
         * contiene todas las propiedades que se usan en transform_call.
         */
        return transform_call(element as S2.ModuleCall)
    default:
      console.log(element);
      throw new Error(`La transformacion de  "${element.type}" aun no fue implementada.`)
  }
}