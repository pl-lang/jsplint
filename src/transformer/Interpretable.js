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

  while_node._loop_body_root = temp_list.firstNode

  return while_node
}

function transformUntil(until_statement) {
  let temp_list = new LinkedList()

  for (let statement of until_statement.body) {
    temp_list.addNode(transformStatement(statement))
  }

  let until_node = new UntilNode({action:'until', condition:until_statement.condition})

  until_node.loop_body_root = temp_list.firstNode

  return until_node
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
