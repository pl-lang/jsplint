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
    name: 'main',
    locals : transformVariables(module.locals),
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

function transformVariables (variables) {
  let result = {}

  for (let name in variables)  {
    let variable = variables[name]

    let transformed_var = {
      name: variable.name,
      type: variable.type
    }

    if (variable.isArray) {
      transformed_var.dimension = variable.dimension
      transformed_var.values = variable.values
    }
    else {
      transformed_var.dimension = [1]
      transformed_var.values = []
    }

    result[name] = transformed_var
  }

  return result
}

function transformModule (module) {
  let result = {
    name: module.name,
    locals : transformVariables(module.locals),
    parameters : module.parameters.map(p => p.name),
    module_type : module.module_type,
    root : null
  }

  let temp_list = new LinkedList()

  for (let statement of module.body) {
    temp_list.addNode(transformStatement(statement))
  }

  // HACK: esto es necesario para que las llamadas a modulos funcionen como debe
  // ser. Está relacionado con el funcionamiento de Evaluator.step()
  // commit anterior: c5b0404e45574cd54b8188d68a8a283031c40902
  let dummy_node = new GenericNode({action:'dummy'})

  dummy_node.setNext(temp_list.firstNode)

  result.root = dummy_node

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
    case 'return':
    return transformReturn(statement)
    default:
    throw new TypeError(`'${statement.type}' no es un tipo de enunciado reconocido`)
  }
}

function transformExpression (token) {
  switch (token.kind) {
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
      break
    case 'literal':
      return new GenericNode({action:'push', value:token.value})
    case 'invocation':
      return transformInvocation(token)
    default:
      console.log(token);
      throw new Error(`Tipo de expresion "${token.kind}" no reconocido.`)
  }
}

function transformInvocation (invocation) {
  let action_list = new LinkedList()

  if (invocation.isArray) {
    let transformed_indexes = invocation.indexes.map(exp => exp.map(transformExpression))

    for (let node_array of transformed_indexes) {
      for (let node of node_array) {
        action_list.addNode(node)
      }
    }
    let access = {action:'subscript', name:invocation.name, total_indexes:invocation.indexes.length}
    action_list.addNode(new GenericNode(access))
  }
  else {
    // actions
    let push = {action:'push', value:1}
    let access = {action:'subscript', name:invocation.name, total_indexes:1}

    action_list.addNode(new GenericNode(push))
    action_list.addNode(new GenericNode(access))
  }

  return action_list.firstNode
}

function transformAssigment(assignment) {
  // las asignaciones se dividen en 2 acciones

  let expression_list = new LinkedList()

  for (let node of assignment.right.map(transformExpression)) {
    expression_list.addNode(node)
  }


  // TODO: cambiar 'pop' por 'assign'
  // pop es una accion que (en el evaluador) desapila una expression de expression_stack y la mete en una variable

  let assign

  let indexes_list = new LinkedList()

  if (assignment.left.isArray) {
    for (let expression of assignment.left.indexes) {
      let node_list = expression.map(transformExpression)

      for (let node of node_list) {
        indexes_list.addNode(node)
      }
    }

    assign = {
      action: 'assign',
      varname: assignment.left.name,
      total_indexes: assignment.left.indexes.length,
      bounds_checked: assignment.left.bounds_checked
    }
  }
  else {
    indexes_list.addNode(new GenericNode({ action: 'push', value:1 }))
    assign = { action: 'assign', varname: assignment.left.name, total_indexes:1, bounds_checked: true }
  }

  let assign_node = new GenericNode(assign)

  indexes_list.addNode(expression_list.firstNode)

  indexes_list.addNode(assign_node)

  return indexes_list.firstNode
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

  let if_node = new IfNode({action:'if'})

  if_node.leftBranchNode = left_branch.firstNode
  if_node.rightBranchNode = right_branch.firstNode

  let expression_list = if_statement.condition.map(transformExpression).reduce((l, n) => { l.addNode(n); return l; }, new LinkedList())

  expression_list.addNode(if_node)

  return expression_list.firstNode
}

function transformWhile(while_statement) {
  let temp_list = new LinkedList()

  for (let statement of while_statement.body) {
    temp_list.addNode(transformStatement(statement))
  }

  let expression_nodes = while_statement.condition.map(transformExpression)

  for (let node of expression_nodes)  {
    temp_list.addNode(node)
  }

  let while_node = new WhileNode({action:'while'})

  while_node.loop_body_root = temp_list.firstNode

  let expression_list = while_statement.condition.map(transformExpression).reduce((l, n) => { l.addNode(n); return l; }, new LinkedList())

  expression_list.addNode(while_node)

  return expression_list.firstNode
}

function transformUntil(until_statement) {
  let new_condition = until_statement.condition

  new_condition.push({kind:'operator', operator:'not'})

  let while_statement = {type:'while', condition:new_condition, body:until_statement.body}

  return transformWhile(while_statement)
}

function transformFor(for_statement) {
  let counter_variable = for_statement.counter_init.left

  let condition = [
    {kind:'invocation', name:counter_variable.name, isArray:counter_variable.isArray, indexes:counter_variable.indexes},
    ...for_statement.last_value,
    {kind:'operator', operator:'minor-equal'}
  ]

  let increment_statement = {
    type: 'assignment',
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

  let new_body = for_statement.body

  new_body.push(increment_statement)

  let while_statement = {type:'while', condition, body:new_body}

  let temp_list = new LinkedList()

  let counter_initialization = transformAssigment(for_statement.counter_init)

  temp_list.addNode(counter_initialization)

  temp_list.addNode(transformWhile(while_statement))

  return temp_list.firstNode
}

function transformCall(call_statement) {
  if (call_statement.name == 'leer') {
    let temp_list = new LinkedList()

    for (let arg of call_statement.args) {
      let assignment

      if (arg[0].isArray) {
        for (let expression of arg[0].indexes) {
          let node_list = expression.map(transformExpression)

          for (let node of node_list) {
            temp_list.addNode(node)
          }
        }

        assignment = {
          action:'assign',
          varname:arg[0].name,
          total_indexes: arg[0].indexes.length,
          // HACK: cambiar esto cuando las invocaciones dentro de leer() tengan
          // esta propiedad
          bounds_checked: false
        }
      }
      else {
        temp_list.addNode(new GenericNode({action:'push', value:1}))

        assignment = {
          action:'assign',
          varname:arg[0].name,
          total_indexes: 1,
          // HACK: cambiar esto cuando las invocaciones dentro de leer() tengan
          // esta propiedad
          bounds_checked: false
        }
      }

      let call = {name: 'leer', action: 'module_call', variable_name: arg[0].name}

      temp_list.addNode(new GenericNode(call))
      temp_list.addNode(new GenericNode(assignment))
    }

    return temp_list.firstNode
  }
  else if (call_statement.name == 'escribir') {
    let temp_list = new LinkedList()

    for (let expression of call_statement.args) {
      let node_list = expression.map(transformExpression)

      for (let node of node_list) {
        temp_list.addNode(node)
      }

      let call = {action: 'module_call', name: 'escribir'}

      temp_list.addNode(new GenericNode(call))
    }

    return temp_list.firstNode
  }
  else {
    let temp_list = new LinkedList()

    for (let expression of call_statement.args) {
      let node_list = expression.map(transformExpression)

      for (let node of node_list) {
        temp_list.addNode(node)
      }
    }

    let call = {action: 'module_call', name: call_statement.name, total_arguments: call_statement.args.length}

    temp_list.addNode(new GenericNode(call))

    return temp_list.firstNode
  }
}

function transformReturn (return_statement) {
  let temp_list = new LinkedList()

  let push = {action:'push', expression:return_statement.expression}

  return new GenericNode(push)
}
