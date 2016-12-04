'use strict'

import * as S2 from '../interfaces/Stage2'

import * as P from '../interfaces/Program'

import {ExpElement, OperatorElement, LiteralValue, InvocationValue, Return} from '../interfaces/ParsingInterfaces'

export default function transform (ast: S2.AST) : P.Program {
    const result = {
        entry_point: null,
        modules: {},
        local_variables: {}
    } as P.Program

    const new_main = transform_main(ast.modules.main)

    result.entry_point = new_main

    /**
     * Falta transformar los modulos
     */

    result.local_variables = ast.local_variables

    return result
}

function transform_main (old_module: S2.Main) : P.Statement {
    return transform_body(old_module.body)
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

    const sif: P.If = {
        exit_point: null,
        kind: P.StatementKinds.If,
        false_branch_entry: false_entry,
        true_branch_entry: true_entry
    }

    /**
     * Hacer que la evaluacion de la condicion venga seguida del if
     */
    P.set_exit(last_statement, sif)

    return sif
}

function transform_while (statement: S2.While) : P.Statement {
    const entry = transform_expression(statement.condition)

    const last_statement = P.get_last(entry)

    const loop_body = transform_body(statement.body)

    P.set_exit(loop_body, entry)

    const swhile: P.While = {
        entry_point: loop_body,
        exit_point: null,
        kind: P.StatementKinds.While
    }

    P.set_exit(last_statement, swhile)

    return swhile
}

function transform_until (statement: S2.Until) : P.Statement {
    const body = transform_body(statement.body)
    const last_statement = P.get_last(body)

    const condition = transform_expression(statement.condition)
    /**
     * La condicion del bucle se evalua luego del ultimo enunciado
     * que este contiene.
     */
    P.set_exit(last_statement, condition)

    const last_st_condition = P.get_last(condition)

    const suntil: P.Until = {
        entry_point: body,
        exit_point: null,
        kind: P.StatementKinds.Until
    }

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
     * El bucle finaliza cuando la variable contador llega al
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

    const swhile: P.While = {
        entry_point: body,
        exit_point: null,
        kind: P.StatementKinds.While
    }

    /**
     * Y ahora hay que enganchar todo:
     * -    inicializacion
     * -    condicion
     * -    enunciado mientras (aca se decide si entrar o no al cuerpo)
     * -    cuerpo
     * -    incremento
     * -    condicion
     */

    P.set_exit(init_last, condition_entry)
    P.set_exit(conditon_last, swhile)
    P.set_exit(swhile, body)
    P.set_exit(body_last, incremement_entry)
    P.set_exit(increment_last, condition_entry)

    return swhile
}

function transform_call (call: S2.Call) : P.Statement {
    /**
     * La transformacion es diferente si la llamada es
     * a 'leer' o 'escribir', o a alguna funcion o
     * procedimiento del usuario.
     */

    if (call.name == 'escribir') {
        return transform_write(call as S2.IOCall)
    }
    else if (call.name == 'leer') {
        return transform_read(call as S2.IOCall)
    }
    else {
        /**
         * Para transformar las llamadas solo hay que encadenar
         * la evaluacion de sus argumentos (en el orden en que aparecen)
         * con el Statement de llamada.
         */
        const first_arg: P.Statement = transform_expression(call.args[0])
        let last_statement = P.get_last(first_arg)

        for (let i = 1; i < call.args.length - 1; i++) {
            const next_arg = transform_expression(call.args[i])
            P.set_exit(last_statement, next_arg)
            last_statement = next_arg
        }

        const ucall: P.UserModuleCall = {
            exit_point: null,
            kind: P.StatementKinds.UserModuleCall,
            name: call.name,
            total_args: call.args.length
        }

        P.set_exit(last_statement, ucall)

        return first_arg
    }
}

function transform_write (wc: S2.IOCall) : P.Statement {
    /**
     * Escribir es un procedimiento que toma solo un argumento,
     * en realidad.
     * Hay que hacer una llamada por cada argumento evaluado.
     */
    const first_arg: P.Statement = transform_expression(wc.args[0])
    let last_statement = P.get_last(first_arg)
    const escribir_call: P.WriteCall = {
        exit_point: null,
        kind: P.StatementKinds.WriteCall,
        name: 'escribir'
    }
    P.set_exit(last_statement, escribir_call)
    last_statement = escribir_call

    for (let i = 0; i < wc.args.length; i++) {
        const next_arg = transform_expression(wc.args[i])
        P.set_exit(last_statement, next_arg)
        const wcall: P.WriteCall = {
            exit_point: null,
            kind: P.StatementKinds.WriteCall,
            name: 'escribir'
        }
        P.set_exit(next_arg, wcall)
        last_statement = wcall
    }

    return first_arg
}

function transform_read (rc: S2.IOCall) : P.Statement {
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
        
        const lcall: P.ReadCall = {
            exit_point: null,
            kind: P.StatementKinds.ReadCall,
            name: 'leer',
            varname: (rc.args[0][0] as S2.InvocationValue).name,
        }

        if (i == 0) {
            first_call == lcall
        }
        else {
            P.set_exit(last_statement, lcall)
        }

        const target_assignment = create_assignment(current_var)

        P.set_exit(lcall, target_assignment)
        last_statement = P.get_last(target_assignment)
    }

    return first_call
}

function create_assignment (v: S2.InvocationValue) : P.Statement {
    if (v.is_array) {
        const first_index = transform_expression(v.indexes[0])
        let last_statement = P.get_last(first_index)
        for (let i = 1; i < v.indexes.length - 1; i++) {
            const next_index = transform_expression(v.indexes[i])
            P.set_exit(last_statement, next_index)
            last_statement = next_index
        }

        const assignment: P.AssignV = {
            dimensions: v.dimensions,
            exit_point: null,
            kind: P.StatementKinds.AssignV,
            total_indexes: v.indexes.length,
            varname: v.name
        }

        P.set_exit(last_statement, assignment)

        return assignment
    }
    else {
        const assignment: P.Assign = {
            exit_point: null,
            kind: P.StatementKinds.Assign,
            varname: v.name
        }

        return assignment
    }
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
    const entry_point: P.Statement = transform_statement(body[0])

    let last_statement: P.Statement = P.get_last(entry_point)

    for (let i = 1; i < body.length - 1; i++) {
        const next_statement = transform_statement(body[i])
        P.set_exit(last_statement, next_statement)
        last_statement = next_statement
    }

    return entry_point
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
            break
        case 'return':
            return transform_return(statement)
    }
}

function transform_assignment (assignment: S2.Assignment) : P.Statement {
    /**
     * Primer enunciado de la evaluacion de la expresion que se debe asignar
     */
    const entry_point: P.Statement = transform_expression(assignment.right)

    /**
     * Este enunciado es el que finalmente pone el valor de la expresion en la
     * pila. Seguido de este va el enunciado de asignacion.
     */
    let last_statement = P.get_last(transform_expression(assignment.right))
    
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
         */
        const assign: P.Assign = {
            kind: P.StatementKinds.Assign,
            varname: assignment.left.name,
            exit_point: null
        }

        last_statement.exit_point = assign
    }

    return entry_point
}

function transform_invocation (i: S2.InvocationValue) : P.Statement {
    if (i.is_array) {
        const first_index = transform_expression(i.indexes[0])
        let last_statement = P.get_last(first_index)
        for (let j = 1; j < i.indexes.length; j++) {
            const next_index = transform_expression(i.indexes[j])
            P.set_exit(last_statement, next_index)
            last_statement = P.get_last(next_index)
        }

        const getv: P.GetV = {
            dimensions: i.dimensions,
            exit_point: null,
            kind: P.StatementKinds.GetV,
            total_indexes: i.indexes.length,
            varname: i.name
        }

        P.set_exit(last_statement, getv)

        return first_index
    }
    else {
        const geti: P.Get = {
            exit_point: null,
            kind: P.StatementKinds.Get,
            varname: i.name
        }

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
    /**
     * Poner al exit de la ultima expresion en null, por las dudas (?)
     */
    last_statement.exit_point = null
    
    return entry
}

function transform_exp_element (element: ExpElement) : P.Statement {
  switch (element.type) {
    case 'operator':
      switch ((element as OperatorElement).name) {
        case 'times':
            return {kind: P.StatementKinds.Times, exit_point:null}
        case 'slash':
            return {kind: P.StatementKinds.Slash, exit_point:null}
        case 'power':
            return {kind: P.StatementKinds.Power, exit_point:null}
        case 'div':
            return {kind: P.StatementKinds.Div, exit_point:null}
        case 'mod':
            return {kind: P.StatementKinds.Mod, exit_point:null}
        case 'minus':
            return {kind: P.StatementKinds.Minus, exit_point:null}
        case 'plus':
            return {kind: P.StatementKinds.Plus, exit_point:null}
        case 'minor':
            return {kind: P.StatementKinds.Minor, exit_point:null}
        case 'minor-eq':
            return {kind: P.StatementKinds.MinorEq, exit_point:null}
        case 'major':
            return {kind: P.StatementKinds.Major, exit_point:null}
        case 'major-eq':
            return {kind: P.StatementKinds.MajorEq, exit_point:null}
        case 'equal':
            return {kind: P.StatementKinds.Equal, exit_point:null}
        case 'not':
            return {kind: P.StatementKinds.Not, exit_point:null}
        case 'different':
            return {kind: P.StatementKinds.Different, exit_point:null}
        case 'and':
            return {kind: P.StatementKinds.And, exit_point:null}
        case 'or':
            return {kind: P.StatementKinds.Or, exit_point:null}
      }
    case 'literal':
        return {kind:P.StatementKinds.Push, value:(element as LiteralValue).value, exit_point:null}
    case 'invocation':
        return transform_invocation(element as S2.InvocationValue)
    case 'call':
        /**
         * Este type assert no causa problemas porque element
         * contiene todas las propiedades que se usan en transform_call.
         */
        return transform_call(element as S2.Call)
    default:
      console.log(element);
      throw new Error(`La transformacion de  "${element.type}" aun no fue implementada.`)
  }
}