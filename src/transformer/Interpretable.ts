'use strict'

import {Success, S0, S2, S3, Typed} from '../interfaces'

import {drop, arr_counter, arr_counter_inc, arr_counter_dec, arr_minor, arr_major, arr_equal} from '../utility/helpers'

export default function transform (p: Typed.Program) : Success<S3.Program> {
    const result = {
        entry_point: null,
        modules: {},
        local_variables: p.variables_per_module
    } as S3.Program

    const new_main = transform_main(p.modules.main)

    result.entry_point = new_main

    for (let name in p.modules) {
        if (name != 'main') {
            const module = transform_module(p.modules[name], name)
            result.modules[name] = module
        }
    }

    return {error: false, result}
}

function transform_main (old_module: Typed.Module) : S3.Statement {
    return transform_body(old_module.body, 'main')
}

function transform_module (old_module: Typed.Module, current_module: string) : S3.Module {
    /**
     * Copio los parametros
     */
    const parameters: {[p: string]: S3.Parameter} = {}
    for (let par of old_module.parameters) {
        const {name, by_ref, is_array, dimensions} = par
        parameters[name] = {name, by_ref, is_array}
    }

    /**
     * Inicializo los parametros. Tienen que ser inicializados
     * de atras para adelante (del ultimo al primero).
     */
    let first_init: S3.Statement
    let last_statement: S3.Statement
    let first_statement_initialized = false
    for (let i = old_module.parameters.length - 1; i >= 0; i--) {
        const param = old_module.parameters[i]
        /**
         * Saltear parametros tomados por referencia, no hace falta
         * inicializarlos
         */
        if (!param.by_ref)  {
            const fake_inv: Typed.Invocation = {
                dimensions: param.dimensions,
                indexes: [],
                is_array: param.is_array,
                name: param.name,
                type: 'invocation',
                typings: {
                    indexes: [],
                    /**
                     * este tipo no sirve para nada, esta aca solo para cumplir
                     * con la interfaz
                     */
                    type: new Typed.AtomicType('literal', 'ninguno')
                }
            }
            let assignment: S3.Statement = null
            if (param.type instanceof Typed.StringType) {
                assignment = new S3.AssignString(current_module, param.name, param.type.length, 0)
            }
            else {
                assignment = create_assignment(fake_inv, current_module)
            }
            if (i == old_module.parameters.length - 1) {
                first_statement_initialized = true
                first_init = assignment
            }
            else {
                last_statement.exit_point = assignment
            }
            last_statement = S3.get_last(assignment)
        }
    }

    const body_entry = transform_body(old_module.body, current_module)

    /**
     * Punto de entrada (primer enunciado) del modulo
     */
    let entry_point: S3.Statement = null

    if (first_statement_initialized) {
        entry_point = first_init
        /**
         * Enlazar la ultima inicializacion al primer enunciado del cuerpo
         */
        last_statement.exit_point = body_entry
    }
    else {
        entry_point = body_entry
    }

    const new_module: S3.Module = {
        entry_point: entry_point,
        name: current_module,
        parameters: parameters
    }

    return new_module
}

function transform_if (statement: Typed.If, module_name: string) : S3.Statement {
    /**
     * La condicion del if debe insertarse antes del propio if
     */
    const entry = transform_expression(statement.condition, module_name)

    /**
     * Ultimo enunciado de la condicion del if
     */
    const last_statement = S3.get_last(entry)

    const true_entry = transform_body(statement.true_branch, module_name)
    const false_entry = transform_body(statement.false_branch, module_name)

    const sif = new S3.If(module_name, true_entry, false_entry)

    /**
     * Hacer que la evaluacion de la condicion venga seguida del if
     */

    last_statement.exit_point = sif

    return entry
}

function transform_while (statement: Typed.While, module_name: string) : S3.Statement {
    /**
     * condicion
     * bucle
     * condicion
     */
    const condition_entry = transform_expression(statement.condition, module_name)
    const cond_last_st = S3.get_last(condition_entry)

    const loop_body = transform_body(statement.body, module_name)
    const body_last_st = S3.get_last(loop_body)

    const swhile = new S3.While(module_name, loop_body)

    cond_last_st.exit_point = swhile

    body_last_st.exit_point = condition_entry

    return condition_entry
}

function transform_until (statement: Typed.Until, module_name: string) : S3.Statement {
    const body = transform_body(statement.body, module_name)
    const body_last_st = S3.get_last(body)

    const condition = transform_expression(statement.condition, module_name)
    /**
     * La condicion del bucle se evalua luego del ultimo enunciado
     * que este contiene.
     */
    body_last_st.exit_point = condition

    const last_st_condition = S3.get_last(condition)

    const suntil = new S3.Until(module_name, body)

    last_st_condition.exit_point = suntil

    return body
}

function transform_for (statement: Typed.For, module_name: string) : S3.Statement {
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
    const init = transform_assignment(statement.counter_init, module_name)
    const init_last = S3.get_last(init)

    /**
     * Ese debe engancharse con la condicion del while.
     * La condicion es <contador> <= <tope>
     */
    const left: Typed.Invocation = statement.counter_init.left

    const condition_exp: Typed.ExpElement[] = [left, ...statement.last_value, {type:'operator', name:'minor-eq'} as S0.OperatorElement]
    const condition_entry = transform_expression(condition_exp, module_name)
    const conditon_last = S3.get_last(condition_entry)

    /**
     * A la evaluacion de la condicion le sigue el cuerpo del bucle
     */
    const body = transform_body(statement.body, module_name)
    const body_last = S3.get_last(body)

    /**
     * Y al cuerpo del bucle le sigue el incremento del contador
     */
    const increment_value = create_literal_number_exp(1)
    const right: Typed.ExpElement[] = [left, increment_value, {type:'operator', name:'plus'} as S0.OperatorElement]

    /**
     * Enunciado S2 del incremento
     */
    const assingment: Typed.Assignment = {
        left: left,
        right: right,
        type: 'assignment',
        typings: {
            left: left.typings.type,
            right: left.typings.type
        }
    }

    /**
     * Ahora ese enunciado de S2 debe convertirse en uno de Program
     */
    const incremement_entry = transform_assignment(assingment, module_name)
    const increment_last = S3.get_last(incremement_entry)

    /**
     * Y ahora hay que enganchar todo:
     * -    inicializacion
     * -    condicion
     * -    enunciado mientras (aca se decide si entrar o no al cuerpo)
     * -    cuerpo
     * -    incremento
     * -    condicion
     */

    const swhile = new S3.While(module_name, body)

    init_last.exit_point = condition_entry
    conditon_last.exit_point = swhile
    body_last.exit_point = incremement_entry
    increment_last.exit_point = condition_entry

    return init
}

function transform_call (call: Typed.Call, module_name: string) : S3.Statement {
    /**
     * Para transformar las llamadas solo hay que encadenar
     * la evaluacion de sus argumentos (en el orden en que aparecen)
     * con el Statement de llamada.
     */
    let first_arg: S3.Statement = null
    let last_statement: S3.Statement = null
    let first_arg_initd = false

    for (let i = 0; i < call.args.length; i++) {
        let next_arg: S3.Statement = null

        if (call.parameters[i].by_ref) {
            const invocation = call.args[i][0] as Typed.Invocation
            /**
             * apilar los indices de la invocacion
             */
            let first_index: S3.Statement = null
            let last_index_st: S3.Statement = null
            let index_initd = false
            for (let j = 0; j < invocation.indexes.length; j++) {
                const next_index = transform_expression(invocation.indexes[j], module_name)
                if (j == 0) {
                    first_index = next_index
                    last_index_st = S3.get_last(first_index)
                    index_initd = true
                }
                else {
                    last_index_st.exit_point = next_index
                    last_index_st = next_index
                }
            }

            const make_alias = new S3.Alias(module_name, invocation.name, invocation.indexes.length, invocation.dimensions, call.parameters[i].name, call.name)

            if (index_initd) {
                last_index_st.exit_point = make_alias
                next_arg = first_index
            }
            else {
                next_arg = make_alias
            }
        }
        else {
            next_arg = transform_expression(call.args[i], module_name)
        }

        if (i == 0) {
            first_arg = next_arg
            last_statement = S3.get_last(first_arg)
            first_arg_initd = true
        }
        else {
            last_statement.exit_point = next_arg
            last_statement = S3.get_last(next_arg)
        }
    }

    const ucall = new S3.UserModuleCall(module_name, call.name, call.args.length)

    if (first_arg_initd) {
        last_statement.exit_point =  ucall

        return first_arg
    }
    else {
        return ucall
    }
}

function transform_write (wc: Typed.Call, module_name: string) : S3.Statement {
    /**
     * Escribir es un procedimiento que toma solo un argumento,
     * en realidad.
     * Hay que hacer una llamada por cada argumento evaluado.
     */
    const first_arg: S3.Statement = transform_expression(wc.args[0], module_name)
    let last_statement = S3.get_last(first_arg)

    if (wc.typings.args[0] instanceof Typed.StringType) {
        const concat = new S3.Concat(module_name, (wc.typings.args[0] as Typed.StringType).length)
        last_statement.exit_point = concat
        last_statement = concat
    }

    const escribir_call = new S3.WriteCall(module_name)

    last_statement.exit_point = escribir_call
    last_statement = escribir_call

    for (let i = 1; i < wc.args.length; i++) {
        const next_arg = transform_expression(wc.args[i], module_name)
        last_statement.exit_point = next_arg
        last_statement = S3.get_last(next_arg)

        if (wc.typings.args[i] instanceof Typed.StringType) {
            const concat = new S3.Concat(module_name, (wc.typings.args[i] as Typed.StringType).length)
            last_statement.exit_point = concat
            last_statement = concat
        }

        const wcall = new S3.WriteCall(module_name)
        last_statement.exit_point = wcall
        last_statement = wcall
    }

    return first_arg
}

function transform_read (rc: Typed.Call, module_name: string): S3.Statement {
    /**
     * Leer tambien es un procedimiento de un solo argumento.
     * Por cada argumento hay que crear una llamada a leer y una asignacion.
     * La llamada a leer inserta el valor leido al tope de la pila.
     */
    let first_call: S3.Statement
    let current_call: S3.Statement
    let last_statement: S3.Statement
    let current_var: Typed.Invocation
    for (let i = 0; i < rc.args.length; i++) {
        /**
         * El type assert es correcto porque esta garantizado por
         * el TypeChecker que los argumentos de un llamado a leer
         * son todos Invocation.
         */
        current_var = rc.args[i][0] as Typed.Invocation

        const lcall = new S3.ReadCall(module_name, current_var.name, current_var.typings.type as (Typed.AtomicType | Typed.StringType))

        if (i == 0) {
            first_call = lcall
        }
        else {
            last_statement.exit_point = lcall
        }

        let target_assignment: S3.Statement = null

        if (current_var.typings.type instanceof Typed.StringType) {
            target_assignment = new S3.AssignString(module_name, current_var.name, current_var.typings.type.length, current_var.indexes.length)
        }
        else {
            target_assignment = create_assignment(current_var, module_name)
        }

        lcall.exit_point =  target_assignment
        last_statement = S3.get_last(target_assignment)
    }

    return first_call
}

function create_assignment (v: Typed.Invocation, module_name: string) : S3.Statement {
    if (v.is_array) {
        if (v.dimensions.length > v.indexes.length) {
            /**
             * tamaño de las dimensiones cuyos indices van a ir variando
             */
            const missing_indexes = drop(v.indexes.length, v.dimensions)
            const smallest_index = arr_counter(missing_indexes.length, 1)
            
            let first_index: S3.Statement
            let last_statement: S3.Statement
            for (let i = arr_counter(missing_indexes.length, 1); arr_minor(i, missing_indexes) || arr_equal(i, missing_indexes); arr_counter_inc(i, missing_indexes, 1)) {
                /**
                 * Los indices que no fueron proprocionados seran completados con los del
                 * contador `i`
                 */
                const final_indexes = v.indexes.concat(i.map(index => [create_literal_number_exp(index)]))

                for (let j = 0; j < final_indexes.length; j++) {
                    const index_exp = transform_expression(final_indexes[j], module_name)

                    /**
                     * Si esta es la primer iteracion de ambos bucles...
                     */
                    if (arr_equal(i, smallest_index) && j == 0) {
                        first_index = index_exp
                    }
                    else {
                        last_statement.exit_point = index_exp
                    }

                    last_statement = S3.get_last(index_exp)
                }

                const assignment = new S3.AssignV(module_name, final_indexes.length, v.dimensions, v.name)

                last_statement.exit_point = assignment

                last_statement = assignment
            }

            return first_index
        }
        else {
            const first_index = transform_expression(v.indexes[0], module_name)
            let last_statement = S3.get_last(first_index)
            for (let i = 0; i < v.indexes.length - 1; i++) {
                const next_index = transform_expression(v.indexes[i + 1], module_name)
                last_statement.exit_point =  next_index
                last_statement = S3.get_last(next_index)
            }

            const assignment = new S3.AssignV(module_name, v.indexes.length, v.dimensions, v.name)

            last_statement.exit_point = assignment

            return first_index
        }
    }
    else {
        const assignment = new S3.Assign(module_name, v.name)

        return assignment
    }
}

function create_literal_number_exp (n: number) : Typed.Literal {
    return {type: 'literal', value: n, typings: {type: new  Typed.AtomicType('literal','entero')}} // este tipo solo esta aca para cumplir con la interfaz
}

function transform_return (ret: Typed.Return, module_name: string) : S3.Statement {
    /**
     * Para transformar 'retornar' solo hay que transformar
     * su expresion. Una vez que se evalue eso, el retorno de
     * la funcion queda al tope de la pila. Luego de eso
     * viene el enunciado 'retornar' que termina la ejecucion
     * de la funcion donde se encuentra.
     */
    const entry = transform_expression(ret.expression, module_name)
    const ret_statement = new S3.Return(module_name)
    S3.get_last(entry).exit_point = ret_statement

    return entry
}

function transform_body (body: Typed.Statement[], module_name: string) : S3.Statement {
    if (body.length > 0) {
        const entry_point: S3.Statement = transform_statement(body[0], module_name)

        let last_statement: S3.Statement = S3.get_last(entry_point)

        for (let i = 0; i < body.length - 1; i++) {
            const next_statement = transform_statement(body[i+1], module_name)
            last_statement.exit_point = next_statement
            last_statement = S3.get_last(next_statement)
        }

        return entry_point
    }
    else {
        return null
    }
}

function transform_statement (statement: Typed.Statement, module_name: string) : S3.Statement {
    switch (statement.type) {
        case 'assignment':
            return transform_assignment(statement, module_name)
        case 'if':
            return transform_if(statement, module_name)
        case 'while':
            return transform_while(statement, module_name)
        case 'until':
            return transform_until(statement, module_name)
        case 'for':
            return transform_for(statement, module_name)
        case 'call':
            switch (statement.name) {
                case 'leer':
                    return transform_read(statement, module_name)
                case 'escribir':
                    return transform_write(statement, module_name)
                default:
                    return transform_call(statement, module_name)
            }
        case 'return':
            return transform_return(statement, module_name)
    }
}

function transform_assignment (a: Typed.Assignment, module_name: string) : S3.Statement {
    if (a.left.dimensions.length > 0 && a.left.indexes.length < a.left.dimensions.length) {
        /**
         * Asignacion vectorial: copiar los contenidos de un vector a otro o asignar
         * una cadena a un vector.
         */

        if (a.typings.left instanceof Typed.StringType && a.typings.right instanceof Typed.StringType && a.typings.right.represents == 'literal') {
            /**
             * Enunciados que apilan la cadena
             */
            const stack_string = transform_expression(a.right, module_name)
            S3.get_last(stack_string).exit_point = new S3.AssignString(module_name, a.left.name, a.typings.left.length, a.left.indexes.length)
            return stack_string
        }
        else {
            /**
             * Copiar contenidos de un vector a otro
             */
            /**
             * Apilar indices del vector que recibe los datos
             */
            let entry: S3.Statement = null
            let last: S3.Statement = null
            let entry_initd = false
            for (let i = 0; i < a.left.indexes.length; i++) {
                if (i == 0) {
                    entry = transform_expression(a.left.indexes[i], module_name)
                    last = S3.get_last(entry)
                    entry_initd = true
                }
                else {
                    const next = transform_expression(a.left.indexes[i], module_name)
                    last.exit_point = next
                    last = S3.get_last(next)
                }
            }

            /**
             * Apilar indices del vector del cual se copian los datos
             * Aclaracion el type assert para a.right es correcto porque ya se verifico
             * (en TSChecker) que el primer y unico componente de esa expresion sea una
             * invocacion de un vector.
             */
            for (let i = 0; i < (a.right[0] as Typed.Invocation).indexes.length; i++) {
                if (!entry_initd) {
                    entry = transform_expression((a.right[0] as Typed.Invocation).indexes[i], module_name)
                    last = S3.get_last(entry)
                }
                else {
                    const next = transform_expression((a.right[0] as Typed.Invocation).indexes[i], module_name)
                    last.exit_point = next
                    last = S3.get_last(next)
                }
            }

            const target: S3.VectorData = {
                name: a.left.name,
                dimensions: a.left.dimensions,
                indexes: a.left.indexes.length
            }

            const source: S3.VectorData = {
                name: (a.right[0] as Typed.Invocation).name,
                dimensions: (a.right[0] as Typed.Invocation).dimensions,
                indexes: (a.right[0] as Typed.Invocation).indexes.length
            }

            const copy_statement = new S3.CopyVec(module_name, target, source)

            if (!entry_initd) {
                return copy_statement
            }
            else {
                last.exit_point = copy_statement

                return entry
            }
        }
    }
    else {
        /**
         * Primer enunciado de la evaluacion de la expresion que se debe asignar
         */
        const entry_point = transform_expression(a.right, module_name)

        /**
         * Ultimo enunciado de evaluacion de la expresion
         */
        let last_statement = S3.get_last(entry_point)

        /**
         * Asignacion normal: hay que copiar un valor a una variable (o una celda de un vector).
         * Para hacer eso hay que poner la expresion que se va a asignar en la pila y luego hacer
         * un enunciado de asignacion.
         * 
         * Si la asignacion es a una celda de un vector, primero hay que la expresion a asignar
         * en la pila, luego los indices de la celda, y por ultimo el enunciado de asignacion.
         */
        if (a.left.is_array) {
            const v = a.left

            const first_index = transform_expression(v.indexes[0], module_name)
            let index_last_st = S3.get_last(first_index)

            for (let i = 0; i < v.indexes.length - 1; i++) {
                let next_index = transform_expression(v.indexes[i + 1], module_name)
                index_last_st.exit_point = next_index
                index_last_st = S3.get_last(next_index) 
            }
            const assignv = new S3.AssignV(module_name, v.indexes.length, v.dimensions, v.name)

            index_last_st.exit_point = assignv
            last_statement.exit_point = first_index

            return entry_point
        }
        else {
            const assign = new S3.Assign(module_name, a.left.name)
            last_statement.exit_point = assign

            return entry_point
        }
    }
}

function transform_invocation (i: Typed.Invocation, module_name: string) : S3.Statement {
    if (i.is_array) {
        if (i.dimensions.length > i.indexes.length) {
            /**
             * tamaño de las dimensiones cuyos indices van a ir variando
             */
            const missing_indexes = drop(i.indexes.length, i.dimensions)
            /**
             * el indice mas pequeño posible
             */
            const smallest_index = arr_counter(i.dimensions.length - i.indexes.length, 1)
            
            let first_index: S3.Statement
            let last_statement: S3.Statement
            /**
             * smallest_index.slice(0) hace una copia de dv
             */
            for (let j = smallest_index.slice(0); arr_minor(j, missing_indexes) || arr_equal(j, missing_indexes); arr_counter_inc(j, missing_indexes, 1)) {
                /**
                 * Los indices que no fueron proprocionados seran completados con los del
                 * contador `i`
                 */
                const final_indexes = i.indexes.concat(j.map(index => [create_literal_number_exp(index)]))

                for (let k = 0; k < final_indexes.length; k++) {
                    const index_exp = transform_expression(final_indexes[k], module_name)

                    /**
                     * Si esta es la primer iteracion de ambos bucles...
                     */
                    if (arr_equal(j, smallest_index) && k == 0) {
                        first_index = index_exp
                    }
                    else {
                        last_statement.exit_point = index_exp
                    }

                    last_statement = S3.get_last(index_exp)
                }

                const invocation = new S3.GetV(module_name, final_indexes.length, i.dimensions, i.name)

                last_statement.exit_point = invocation

                last_statement = invocation
            }

            return first_index
        }
        else {
            const first_index = transform_expression(i.indexes[0], module_name)
            let last_statement = S3.get_last(first_index)
            for (let j = 1; j < i.indexes.length; j++) {
                const next_index = transform_expression(i.indexes[j], module_name)
                last_statement.exit_point = next_index
                last_statement = S3.get_last(next_index)
            }
            
            const getv = new S3.GetV(module_name, i.indexes.length, i.dimensions, i.name)

            last_statement.exit_point = getv

            return first_index
        }
    }
    else {
        const geti = new S3.Get(module_name, i.name)

        return geti
    }
}

function transform_literal (l: Typed.Literal, module_name: string): S3.Statement {
    if (l.typings.type instanceof Typed.StringType) {
        const length = (l.typings.type as Typed.StringType).length

        let first: S3.Statement = new S3.Push(module_name, '\0');
        let last: S3.Statement = first;
        for (let i = 0; i < length; i++) {
            const next = new S3.Push(module_name, (l.value as string)[i])
            last.exit_point = next
            last = next
        }
        return first
    }
    else {
        return new S3.Push(module_name, l.value)
    }
}

function transform_expression (expression: Typed.ExpElement[], module_name: string) : S3.Statement {
    const statements: S3.Statement[] = []
    for (let e of expression) {
        statements.push(transform_exp_element(e, module_name))
    }

    const entry = statements[0]
    let last_statement: S3.Statement = S3.get_last(entry)
    for (let i = 0; i < statements.length - 1; i++) {
        last_statement.exit_point = statements[i + 1]
        last_statement = S3.get_last(statements[i + 1])
    }
    
    return entry
}

function transform_exp_element (element: Typed.ExpElement, module_name: string) : S3.Statement {
  switch (element.type) {
    case 'operator':
      switch ((element as S0.OperatorElement).name) {
        case 'times':
            return new S3.Operation(module_name, S3.StatementKinds.Times)
        case 'slash':
            return new S3.Operation(module_name, S3.StatementKinds.Slash)
        case 'power':
            return new S3.Operation(module_name, S3.StatementKinds.Power)
        case 'div':
            return new S3.Operation(module_name, S3.StatementKinds.Div)
        case 'mod':
            return new S3.Operation(module_name, S3.StatementKinds.Mod)
        case 'minus':
            return new S3.Operation(module_name, S3.StatementKinds.Minus)
        case 'plus':
            return new S3.Operation(module_name, S3.StatementKinds.Plus)
        case 'minor':
            return new S3.Operation(module_name, S3.StatementKinds.Minor)
        case 'minor-eq':
            return new S3.Operation(module_name, S3.StatementKinds.MinorEq)
        case 'major':
            return new S3.Operation(module_name, S3.StatementKinds.Major)
        case 'major-eq':
            return new S3.Operation(module_name, S3.StatementKinds.MajorEq)
        case 'equal':
            return new S3.Operation(module_name, S3.StatementKinds.Equal)
        case 'not':
            return new S3.Operation(module_name, S3.StatementKinds.Not)
        case 'different':
            return new S3.Operation(module_name, S3.StatementKinds.Different)
        case 'and':
            return new S3.Operation(module_name, S3.StatementKinds.And)
        case 'or':
            return new S3.Operation(module_name, S3.StatementKinds.Or)
      }
      break
    case 'literal':
        return transform_literal(element, module_name)
    case 'invocation':
        return transform_invocation(element, module_name)
    case 'call':
        return transform_call(element, module_name)
  }
}