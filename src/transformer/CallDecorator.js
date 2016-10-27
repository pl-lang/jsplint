// Esta transformacion agrega a cada llamada de funcion:
//
// -  Su tipo de retorno.
//
// -  Los declaradores de sus parametros.
//
// Si la funcion no existe entonces devuelve un error.

import {bind, bindN, mergeObjs} from '../utility/helpers.js'

import {curry} from 'ramda'

const clone_obj = curry(mergeObjs)({})

export default function transform (ast) {
  let new_ast = {
    modules: {},
    local_variables: {}
  }

  let errors_found = []

  for (let module_name in ast.modules) {
    let module = ast.modules[module_name]
    let report = transform_module(module, ast)
    if (report.error) errors_found.push(...report.result)
    else new_ast.modules[module_name] = report.result
  }

  new_ast.local_variables = ast.local_variables

  let error = errors_found.length > 0

  let result = error ? errors_found:new_ast

  return {error, result}
}

function transform_module (module, ast) {
  let new_body = transform_body(module.body, ast)

  return bind(make_module(module), new_body)
}

function transform_body (statements, ast) {
  let errors_found = []
  let new_body = []

  for (let statement of statements) {
    let new_statement = transform_statement(statement, ast)
    if (new_statement.error) errors_found.push(...new_statement.result)
    else new_body.push(new_statement.result)
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:new_body

  return {error, result}
}

function transform_statement (statement, ast) {
  switch (statement.type) {
    case 'assignment':
      return transform_assignment(statement, ast)
    case 'call':
      return transform_call(statement, ast)
    case 'for':
      return transform_for(statement, ast)
    case 'until':
    case 'while':
      return transform_crtl(statement, ast)
    case 'if':
      return transform_if(statement, ast)
    case 'declaration':
      return {error:false, result:statement}
    case 'return':
      return transform_return(statement, ast)
    default:
      throw new Error(`@FunctionDecorator: no se puede transformar un enunciado "${statement.type}"`)
  }
}

function transform_assignment (assignment, module) {
  let variable = transform_invocation(assignment.left, module)

  let payload = transform_expression(assignment.right, module)

  // make_assignment(vartype, payload_type)
  return bindN(make_assignment, variable, payload)
}

function transform_call (call, ast) {
  // si es una de las funciones especiales del lenguaje, no hay que transformarla
  if (is_builtin(call.name)) return {error:false, result:clone_obj(call)}

  let info = get_module_info(call.name, ast)

  return bind(make_call(call), info)
}

function transform_crtl (statement, ast) {
  let new_condition = transform_expression(statement.condition, ast)

  let new_body = transform_body(statement.body, ast)

  // make_ctrl_statement(statement, new_condition, new_body)
  return bindN(make_ctrl_statement(statement), new_condition, new_body)
}

function transform_if (statement, ast) {
  let new_condition = transform_expression(statement.condition, ast)

  let new_true_branch = transform_body(statement.true_branch, ast)

  let new_false_branch = transform_body(statement.false_branch, ast)

  //make_if(statement, new_condition, new_true_branch, new_false_branch)
  return bindN(make_if(statement), new_condition, new_true_branch, new_false_branch)
}

function transform_for (statement, ast) {
  let new_init = transform_assignment(statement.counter_init, ast)

  let new_goal = transform_expression(statement.last_value, ast)

  let new_body = transform_body(statement.body, ast)

  return bindN(make_for(statement), new_init, new_goal, new_body)
}

function transform_return (ret_statement, ast) {
  let exp_returned = transform_expression(ret_statement.expression, ast)

  return bind(make_return, exp_returned)
}

function transform_invocation(invocation, ast) {
  if (invocation.indexes.length == 0) return {error:false, result:invocation}
  else {
    let errors_found = []
    let new_indexes = []

    for (let index of invocation.indexes) {
      let new_index = transform_expression(index, ast)
      if (new_index.error) errors_found.push(...new_index.result)
      else new_indexes.push(new_index.result)
    }

    let error = errors_found.length > 0
    let result = error ? errors_found:new_indexes

    return bind(make_invocation(invocation), {error, result})
  }
}

function transform_expression (expression, ast) {
  let errors_found = []
  let output = []

  for (let element of expression) {
    let new_element

    if (element.type == 'call')
      new_element = transform_call(element, ast)
    else if (element.type == 'invocation')
      new_element = transform_invocation(element, ast)
    else if (element.type == 'literal' || element.type == 'operator')
      new_element = {error:false, result:element}


    if (new_element.error) errors_found.push(...new_element.result)
    else output.push(new_element.result)
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function get_module_info (name, ast) {
  if ( !(name in ast.modules) ) {
    let result = [{reason: '@call-undefined-module', name}]
    return {error:true, result}
  }
  else {
    let result = {
      parameters: ast.modules[name].parameters,
      return_type: ast.modules[name].return_type,
      module_type: ast.modules[name].module_type
    }

    return {error:false, result}
  }
}

const make_module = curry((old_module, body) => {
  let result = clone_obj(old_module)
  result.body = body
  return {error: false, result}
})

const make_assignment = curry((left, right) => {
  let result = {type:'assignment', left, right}
  return {error: false, result}
})

const make_return = curry(expression => {
  return {error:false, result:{type:'return', expression}}
})

const make_call = curry((old_call, info) => {
  let result = clone_obj(old_call)
  result.parameters = info.parameters
  result.return_type = info.return_type
  result.module_type = info.module_type
  return {error: false, result}
})

const make_ctrl_statement = curry((statement, condition, body) => {
  let result = clone_obj(statement)
  result.condition = condition
  result.body = body
  return {error: false, result}
})

const make_if = curry((statement, condition, true_branch, false_branch) => {
  let result = clone_obj(statement)
  result.condition = condition
  result.true_branch = true_branch
  result.false_branch = false_branch
  return {error: false, result}
})

const make_for = curry((statement, counter_init, last_value, body) => {
  return {error:false, result:{type:'for', counter_init, last_value, body}}
})

const make_invocation = curry((old_invocation, new_indexes) => {
  let new_invocation = clone_obj(old_invocation)
  new_invocation.indexes = new_indexes
  return {error: false, result: new_invocation}
})


function is_builtin (name) {
  return name == 'escribir' || name == 'escribir_linea' || name == 'leer'
}
