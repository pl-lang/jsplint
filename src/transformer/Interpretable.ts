'use strict'

import * as S2 from '../interfaces/Stage2'

import * as P from '../interfaces/Program'

import {ExpElement, OperatorElement, LiteralValue} from '../interfaces/ParsingInterfaces'

export default function transfrom (ast: S2.AST) : P.Program {
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
        case 'for':
        case 'call':
        case 'return':
        default:
        throw new TypeError(`'${statement.type}' no es un tipo de enunciado reconocido`)
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
    case 'call':
    default:
      console.log(element);
      throw new Error(`La transformacion de  "${element.type}" aun no fue implementada.`)
  }
}