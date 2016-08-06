'use strict'

import { LinkedList, getChainLenght, getLastNode } from '../parser/ast/List.js'

import { GenericNode, WhileNode, IfNode, UntilNode } from '../parser/ast/Nodes.js'

export default function transform(ast) {
  let program = {
    modules : {}
  }

  for (let module of ast.modules) {
    if (module.module_type == 'main') {
      program.modules[module.name] = transformMain(module)
    }
    else {
      program.modules[module.name] = transformModule(module)
    }
  }

  return program
}

function transformMain (module) {
  let result = {
    locals : module.locals,
    parameters: [],
    module_type : 'main',
    root : null
  }

  let temp_list = new LinkedList()

  for (let statement of module.body) {
    temp_list.addNode(transformStatement(statement))
  }

  result.root = temp_list.firstNode

  return result
}

function transformModule (module) {
  let result = {
    locals : module.locals,
    parameters : module.parameters.map(p => p.name),
    module_type : module.module_type,
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
  // las asignaciones se dividen en 2 acciones

  let push = {
    action: 'push',
    expression: assignment.right
  }

  let pop = {
    action: 'pop',
    variable: assignment.left
  }

  pop.variable['bounds_checked'] = false

  let push_node = new GenericNode(push)
  push_node.setNext(new GenericNode(pop))

  return push_node
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

  let condition = [
    {kind:'invocation', name:counter_variable.name, isArray:counter_variable.isArray, indexes:counter_variable.indexes},
    ...for_statement.last_value,
    {kind:'operator', operator:'minor-equal'}
  ]

  let while_node = new WhileNode({action:'while', condition})

  let body_statement_nodes = for_statement.body.map(transformStatement)

  let temp_list = new LinkedList()

  for (let statement of body_statement_nodes) {
    temp_list.addNode(statement)
  }

  let increment_statement = {
    action: 'assignment',
    left: counter_variable,
    right: [
      {
        kind: 'invocation',
        indexes: counter_variable.indexes,
        isArray: counter_variable.isArray,
        name: counter_variable.name
      },
      {kind:'literal', type:'entero', value:1},
      {kind:'operator', operator:'plus'}
    ]
  }

  let increment_node = transformAssigment(increment_statement)

  temp_list.addNode(increment_node)

  while_node.loop_body_root = temp_list.firstNode

  counter_init_node.setNext(while_node)

  return counter_init_node
}

function transformCall(call_statement) {
  if (call_statement.name == 'leer') {
    let temp_list = new LinkedList()

    for (let arg of call_statement.args) {
      let call = {name: 'leer', action: 'module_call', variable_name: arg[0].name}

      let pop = {action:'pop', variable:arg[0]}

      temp_list.addNode(new GenericNode(call))
      temp_list.addNode(new GenericNode(pop))
    }

    return temp_list.firstNode
  }
  else {
    let call = {
      name:call_statement.name,
      action:'module_call',
      expression_type:'module_call',
      args:call_statement.args
    }

    return new GenericNode(call)
  }
}
