// este modulo toma un 'modulo' de pl...
/*

modulo = {
  type:'module',
  name:'x',
  body:[]
}

*/

// y lo transforma en:

/*

modulo = {
  type:'module',
  name:'x',
  locals:{}
  body:[]
}

*/

'use strict'

import Report from '../utility/Report.js'

export default function transformAST(ast) {
  let program = {
    modules : []
  }

  for (let module of ast.modules) {
    program.modules.push(transformModule(module))
  }

  return program
}

function transformModule(module) {
  let result = {
    type:'module',
    name: module.name,
    body: []
  }
  for (let statement of module.body) {
    if (statement.type === 'declaration') {
      result.body.push(statement)
    }
    else {
      result.body.push(transformStatement(statement))
    }
  }

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

function transformAssigment (statement) {
  let result = {
    type : 'assignment',
    left : null,
    right : null
  }

  if (statement.left.isArray) {
    result.left = transformArrayInvocation(statement.left)
  }
  else {
    result.left = statement.left
  }

  result.right = treeToRPN(statement.right)

  return result
}

function transformIf (statement) {
  let result = {
    type : 'if',
    condition : null,
    true_branch : statement.true_branch,
    false_branch: statement.false_branch
  }

  result.condition = treeToRPN(statement.condition)

  return result
}

function transformWhile (statement) {
  let result = {
    type : 'while',
    condition : null,
    body : []
  }

  result.condition = treeToRPN(statement.condition)

  for (let s of statement.body) {
    result.body.push(transformStatement(s))
  }

  return result
}

function transformUntil (statement) {
  let result = {
    type : 'until',
    condition : null,
    body : []
  }

  result.condition = treeToRPN(statement.condition)

  for (let s of statement.body) {
    result.body.push(transformStatement(s))
  }

  return result
}

function transformFor (statement) {
  let result = {
    type: 'for',
    counter_init: null,
    last_value: null,
    body: []
  }

  result.counter_init = treeToRPN(statement.counter_init)

  result.last_value = treeToRPN(statement.last_value)

  for (let s of statement.body) {
    result.body.push(transformStatement(s))
  }

  return result
}

function transformCall (statement) {
  let result = {
    type:'call',
    args: [],
    name: statement.name,
    expression_type:'module_call'
  }

  for (let arg of statement.args) {
    result.args.push(treeToRPN(arg))
  }

  return result
}

function transformArrayInvocation (array) {
  let transformed_indexes = []
  for (let index of array.indexes) {
    transformed_indexes.push(treeToRPN(index))
  }
  let new_left = {}
  for (let prop in array) {
    if (prop === 'indexes') {
      new_left.indexes = transformed_indexes
    }
    else {
      new_left[prop] = array[prop]
    }
  }
  return new_left
}


function treeToRPN (exp_root) {
  let stack = []

  if (exp_root.expression_type === 'operation') {
    let op = {kind:'operator', operator:exp_root.op}
    let left_operand = treeToRPN(exp_root.operands[0])
    let right_operand = treeToRPN(exp_root.operands[1])
    stack.push(...left_operand, ...right_operand, op)
  }
  else if (exp_root.expression_type === 'unary-operation') {
    let op = {kind:'operator', operator:exp_root.op}
    let operand = treeToRPN(exp_root.operand)
    stack.push(...operand, op)
  }
  else if (exp_root.expression_type === 'expression') {
    let rpn_contents = treeToRPN(exp_root.expression)
    stack.push(...rpn_contents)
  }
  else {
    if (exp_root.isArray) {
      exp_root = transformArrayInvocation(exp_root)
    }
    let exp = {}
    for (let prop in exp_root) {
      if (prop === 'expression_type') {
        exp.kind = exp_root[prop]
      }
      else {
        exp[prop] = exp_root[prop]
      }
    }
    stack.push(exp)
  }

  return stack
}
