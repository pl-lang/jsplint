'use strict'

import { LinkedList, getChainLenght, getLastNode } from '../parser/ast/List.js'

import { GenericNode, WhileNode, IfNode, UntilNode } from '../parser/ast/Nodes.js'

export default function transform(ast) {
  let program = {
    modules : {}
  }

  for (let module of ast.modules) {
    program.modules[module.name] = transformModule(module)
  }

  return program
}

function transformModule(module) {
  let result = {
    locals : module.locals,
    root : null
  }

  let temp_list = new LinkedList()

  for (let statement of module.body) {
    temp_list.addNode(transformStatement(statement))
  }

  result.root = temp_list.firstNode

  return result
}

function transformStatement(statement) {
  switch (statement.type) {
    case 'assignment':
    return transformAssigment(statement)
    case 'if':
    return transformIf(statement)
    case 'while':
    return transformWhile(statement)
    case 'until':
    return transformUntil(statement)
    case 'for':
    return transformFor(statement)
    case 'call':
    return transformCall(statement)
    default:
    throw new TypeError(`'${statement.type}' no es un tipo de enunciado reconocido`)
  }
}

function transformAssigment(assignment) {
  let result = {
    action : 'assignment',
    target : assignment.left,
    payload : assignment.right
  }

  result.target['bounds_checked'] = false

  return new GenericNode(result)
}

function transformIf(if_statement) {
  let left_branch = new LinkedList()
  let right_branch = new LinkedList()

  for (let statement of if_statement.true_branch) {
    right_branch.addNode(transformStatement(statement))
  }

  for (let statement of if_statement.false_branch) {
    left_branch.addNode(transformStatement(statement))
  }

  let if_node = new IfNode({action:'if', condition:if_statement.condition})

  if_node.leftBranchNode = left_branch.firstNode
  if_node.rightBranchNode = right_branch.firstNode

  return if_node
}

function transformWhile(while_statement) {
  let temp_list = new LinkedList()

  for (let statement of while_statement.body) {
    temp_list.addNode(transformStatement(statement))
  }

  let while_node = new WhileNode({action:'while', condition:while_statement.condition})

  while_node.loop_body_root = temp_list.firstNode

  return while_node
}

function transformUntil(until_statement) {
  let until_node = new UntilNode({action:'until', condition:until_statement.condition})

  let body_statement_nodes = until_statement.body.map(transformStatement)

  let temp_list = new LinkedList()

  for (let i = 0; i < body_statement_nodes.length; i++) {
    let current_node = body_statement_nodes[i]

    if (i == body_statement_nodes.length - 1) {
      current_node.setNext(until_node)
    }

    temp_list.addNode(current_node)
  }

  until_node.loop_body_root = temp_list.firstNode

  // return until_node
  return temp_list.firstNode
}

// 'para' <variable> <- <expresion> 'hasta' <expresion.entera>
//    [<enunciado>]
// 'finpara'
//
/*
  Lo de arriba se transfora en....
 */
// <variable> <- <expresion>
// mientras (<variable> <= <expresion.entera>)
//  [<enunciado>]
// finmientras
function transformFor(for_statement) {
  let counter_variable = for_statement.counter_init.left
  let counter_init_statement = for_statement.counter_init
  let counter_init_node = transformAssigment(counter_init_statement)

  let condition = {
    expression_type: 'operation',
    op: 'minor-equal',
    operands: [
      {expression_type:'invocation', name:counter_variable.name, isArray:counter_variable.isArray, indexes:counter_variable.indexes},
      for_statement.last_value
    ]
  }

  let while_node = new WhileNode({action:'while', condition})

  let body_statement_nodes = for_statement.body.map(transformStatement)

  let temp_list = new LinkedList()

  for (let statement of body_statement_nodes) {
    temp_list.addNode(statement)
  }

  let increment_statement = {
    action: 'assignment',
    left: counter_variable,
    right: {
      expression_type: 'operation',
      op: 'plus',
      operands: [
        {
          expression_type: 'invocation',
          indexes: counter_variable.indexes,
          isArray: counter_variable.isArray,
          name: counter_variable.name
        },
        { expression_type: 'literal', type: 'entero', value: 1 }
      ]
    }
  }

  let increment_node = transformAssigment(increment_statement)

  temp_list.addNode(increment_node)

  while_node.loop_body_root = temp_list.firstNode

  counter_init_node.setNext(while_node)

  return counter_init_node
}

function transformCall(call_statement) {
  let call = {
    name:call_statement.name,
    action:'module_call',
    expression_type:'module_call',
    args:call_statement.args
  }

  return new GenericNode(call)
}
