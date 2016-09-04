// Esta transformacion agrega a cada llamada de funcion:
//
// -  Su tipo de retorno.
//
// -  Los declaradores de sus parametros.
//
// Si la funcion no existe entonces devuelve un error.

import {bind, mergeObjs} from '../utility/helpers.js'

import {curry} from 'ramda'

const clone_obj = curry(mergeObjs)({})

export default function transform (ast) {
  let new_ast = {}

  let errors_found = []

  for (let module_name in ast) {
    let module = ast[module_name]
    let report = transform_module(module, ast)
    if (report.error) errors_found.push(...report.result)
    else new_ast[module_name] = report.result
  }

  let error = errors_found.length > 0

  let result = error ? errors_found:new_ast

  return {error, result}
}

function transform_module (module, ast) {
  // throw Error(`@FunctionDecorator.js: no se como transformar modulos de tipo ${module.module_type}`)
  let new_body = transform_body(module.body, ast)

  return bind(make_module(module), new_body)
}

function transform_body (statements, ast) {
  let errors_found = []
  let new_body = []

  for (let statement of statements) {
    let new_statement = transform_statement(statement, ast)
    if (new_statement.error) errors_found.push(new_statement.result)
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
      // return transform_for(statement, ast)
      throw new Error('@FunctionDecorator: la transformacion de "fors" no esta implementada')
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

  // make_assignment >>= vartype >>= payload_type
  return bind(bind(make_assignment, variable), payload)
}

function transform_call (call, ast) {
  let info = get_module_info(call.name, ast)

  return bind(make_call(call), info)
}

function transform_crtl (statement, ast) {
  let new_condition = transform_expression(statement.condition, ast)

  let new_body = transform_body(statement.body, ast)

  return bind(bind(make_ctrl_statement(statement), new_condition), new_body)
}

function transform_if (statement, ast) {
  let new_condition = transform_expression(statement.condition, ast)

  let new_true_branch = transform_body(statement.true_branch, ast)

  let new_false_branch = transform_body(statement.false_branch, ast)

  return bind(bind(bind(make_if(statement), new_condition), new_true_branch), new_false_branch)
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
      let new_index = transform_expression(index)
      if (new_index.error) errors_found.push(new_index.result)
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


    if (new_element.error) errors_found.push(new_element.error)
    else output.push(new_element.result)
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function get_module_info (name, ast) {
  if (name == 'escribir' || name == 'leer' || name == 'escribir_linea') {
    throw new Error(`Falta la info de tipos de ${name}`)
  }
  if ( !(name in ast) ) {
    let result = {reason: '@call-undefined-function', name}
    return {error:true, result}
  }
  else {
    let result = {
      parameters: ast[name].parameters,
      return_type: ast[name].return_type,
      module_type: ast[name].module_type
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

const make_invocation = curry((old_invocation, new_indexes) => {
  let new_invocation = clone_obj(old_invocation)
  new_invocation.indexes = new_indexes
  return {error: false, result: new_invocation}
})
