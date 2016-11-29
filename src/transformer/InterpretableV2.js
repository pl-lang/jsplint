'use strict'

import { LinkedList, getChainLenght, getLastNode } from '../parser/ast/List.js'

import { GenericNode, WhileNode, IfNode, UntilNode } from '../parser/ast/Nodes.js'

export default function transfrom (ast) {
    const result = {
        modules: {},
        locals: ast.local_variables
    }

    for (let module_name in ast.modules) {
        const module = ast.modules[module_name]

        let new_module

        if (module.module_type == 'main') {
            new_module = transform_main(module)
        }
        else {
            new_module = transform_module(module)
        }

        result.modules[module.main] = new_module.result
    }

    return {error:false, result}
}

function transform_main (module) {
    let result = {
        module_type: 'main',
        name: 'main',
        root: null
    }

    const list = new LinkedList

    for (let statement of module.body) {
        const new_statement = transform_statement(statement) 
        list.addNode(new_statement.result)
    }

    result.root = list.firstNode

    return {error:false, result}
}

function transform_statement (statement) {
    switch (statement.type) {
        case 'assignment':
            return transform_assignment(statement)
        case 'if':
        case 'while':
        case 'until':
        case 'for':
        case 'call':
        case 'return':
        default:
        throw new TypeError(`'${statement.type}' no es un tipo de enunciado reconocido`)
    }
}

function transform_assignment (assignment) {
    const list = new LinkedList()

    if (assignment.left.dimensions > 0 && assignment.left.indexes < assignment.left.dimensions) {
        // asignacion vectorial
    }
    else {
        // Asignacion normal: 1. Evaluar la expresion 2. Asignarla a la variable o celda del vector

        // Lista de acciones necesarias para evaluar la expresion
        // una vez que todas estas se ejecutan el valor final de la expresion
        // queda al tope de la pila. A eso hay que agregarla la asignacion
        const expression_actions = transform_expression(assignment.right)

        // Crear la instruccion de asignacion
        let assign
        if (!assignment.left.isArray) {
            assign = {action:'assign', variable:assignment.left.name}
        }
        else {
            // Hay que evaluar y apilar los indices
            const indexes_evaluation = new LinkedList()

            for (let expression of assignment.left.indexes) {
                const evaluation = transform_expression(expression)
                indexes_evaluation.addNode(evaluation.firstNode)
            }

            // Agregar evaluacion de indices a evaluacion del valor
            expression_actions.addNode(indexes_evaluation.firstNode)

            assign = {action:'assignv', variable:assign.left.name, indexes:assignment.left.indexes.length}
        }

        // Agregar la asignacion al resto de las acciones
        expression_actions.addNode(new GenericNode(assign))

        return {error:false, result:expression_actions.firstNode}
    }
}

function transform_expression (expression) {
    const actions = expression.map(transform_expression_token)
    const list = new LinkedList()
    for (let action of actions) {
        list.addNode(action)
    }
    return list
}

function transform_expression_token (token) {
  switch (token.type) {
    case 'operator':
      switch (token.operator) {
        case 'times':
        case 'unary-minus':
        case 'division':
        case 'power':
        case 'div':
        case 'mod':
        case 'divide':
        case 'minus':
        case 'plus':
        case 'minor-than':
        case 'minor-equal':
        case 'major-than':
        case 'major-equal':
        case 'equal':
        case 'not':
        case 'diff-than':
        case 'and':
        case 'or':
          return new GenericNode({action:token.operator})
        default:
          console.log(token);
          throw new Error(`Operador "${token.operator}" no reconocido`)
      }
    case 'literal':
        return new GenericNode({action:'push', value:token.value})
    case 'invocation':
        throw new Error('transformacion de invocaciones no implementada')
        // return transformInvocation(token)
    default:
      console.log(token);
      throw new Error(`Tipo de expresion "${token.type}" no reconocido.`)
  }
}

function create_literal (value) {
    return {type:'literal', value}
}