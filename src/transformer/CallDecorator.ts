// Esta transformacion agrega a cada llamada de funcion:
//
// -  Su tipo de retorno.
//
// -  Los declaradores de sus parametros.
//
// Si la funcion no existe entonces devuelve un error.

import * as S1 from '../interfaces/Stage1'

import * as S2 from '../interfaces/Stage2'

import {IError, ISuccess} from '../interfaces/Utility'

export default function transform (ast: S1.AST) : IError<S2.UndefinedModule[]> | ISuccess<S2.AST> {
  const new_ast = {
    modules: {},
    local_variables: {}
  } as S2.AST

  const errors_found: S2.UndefinedModule[] = []

  for (let module_name in ast.modules) {
    const old_module = ast.modules[module_name]
    const report = transform_module(old_module, ast, module_name)
    if (report.error) {
      errors_found.push(...report.result)
    }
    else {
      new_ast.modules[module_name] = report.result as S2.Module
    }
  }

  new_ast.local_variables = ast.local_variables

  if (errors_found.length > 0) {
    return {error:true, result:errors_found}
  }
  else {
    return {error:false, result:new_ast}
  }
}

function transform_module (old_module: S1.Module, ast: S1.AST, module_name: string) : IError<S2.UndefinedModule[]> | ISuccess<S2.Module> {
  const new_body = transform_body(old_module.body, ast, module_name)

  return bind(make_module(old_module), new_body)
}

function transform_body (statements: S1.Statement[], ast: S1.AST, module_name: string) {
  const errors_found = []
  const new_body: S2.Statement[] = []

  for (let statement of statements) {
    const new_statement = transform_statement(statement, ast, module_name)
    if (new_statement.error) {
      errors_found.push(...new_statement.result)
    }
    else {
      new_body.push(new_statement.result)
    }
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:new_body

  return {error, result}
}

function transform_statement (statement: S1.Statement, ast: S1.AST, module_name: string) : IError<> | ISuccess<S2.Statement> {
  switch (statement.type) {
    case 'assignment':
      return transform_assignment(statement, ast, module_name)
    case 'call':
      return transform_call(statement, ast, module_name)
    case 'for':
      return transform_for(statement, ast, module_name)
    case 'until':
    case 'while':
      return transform_crtl(statement, ast, module_name)
    case 'if':
      return transform_if(statement, ast, module_name)
    case 'declaration':
      return {error:false, result:statement}
    case 'return':
      return transform_return(statement, ast, module_name)
    default:
      throw new Error(`@FunctionDecorator: no se puede transformar un enunciado "${statement.type}"`)
  }
}

function transform_assignment (assignment, ast, module_name) {
  let variable = transform_invocation(assignment.left, ast, module_name)

  let payload = transform_expression(assignment.right, ast, module_name)

  // make_assignment(vartype, payload_type)
  return bindN(make_assignment, variable, payload)
}

function transform_call (call, ast, module_name) {
  // si es una de las funciones especiales del lenguaje, no hay que transformarla
  if (is_builtin(call.name)) return {error:false, result:clone_obj(call)}

  let info = get_module_info(call.name, ast)

  return bind(make_call(call), info)
}

function transform_crtl (statement, ast, module_name) {
  let new_condition = transform_expression(statement.condition, ast, module_name)

  let new_body = transform_body(statement.body, ast, module_name)

  // make_ctrl_statement(statement, new_condition, new_body)
  return bindN(make_ctrl_statement(statement), new_condition, new_body)
}

function transform_if (statement, ast, module_name) {
  let new_condition = transform_expression(statement.condition, ast, module_name)

  let new_true_branch = transform_body(statement.true_branch, ast, module_name)

  let new_false_branch = transform_body(statement.false_branch, ast, module_name)

  //make_if(statement, new_condition, new_true_branch, new_false_branch)
  return bindN(make_if(statement), new_condition, new_true_branch, new_false_branch)
}

function transform_for (statement, ast, module_name) {
  let new_init = transform_assignment(statement.counter_init, ast, module_name)

  let new_goal = transform_expression(statement.last_value, ast, module_name)

  let new_body = transform_body(statement.body, ast, module_name)

  return bindN(make_for(statement), new_init, new_goal, new_body)
}

function transform_return (ret_statement, ast, module_name) {
  let exp_returned = transform_expression(ret_statement.expression, ast, module_name)

  return bind(make_return, exp_returned)
}

function transform_invocation(invocation, ast, module_name) {
  if (invocation.indexes.length == 0) {
    let varinfo = get_variable_info(invocation.name, ast.local_variables, module_name)
    return bind(add_var_info(invocation), varinfo)
  }
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

    // operacion 1
    let varinfo = get_variable_info(invocation.name, ast.local_variables, module_name)

    // operacion 2
    let transformed_invocation = bind(make_invocation(invocation), {error, result})

    // El problema de usar bindN es que si las dos operaciones fallan solo se informa el error de la
    // primera. Por ahora eso funciona, pero seria bueno reportar ambos.
    return bindN(add_var_info, transformed_invocation, varinfo)
  }
}

function transform_expression (expression, ast, module_name) {
  let errors_found = []
  let output = []

  for (let element of expression) {
    let new_element

    if (element.type == 'call')
      new_element = transform_call(element, ast, module_name)
    else if (element.type == 'invocation')
      new_element = transform_invocation(element, ast, module_name)
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

function get_variable_info (name, variables, module_name) {
  if (name in variables[module_name]) {
    let result = {
      dimension: variables[module_name][name].dimension
    }

    return {error:false, result}
  }
  else if (name in variables.main) {
    let result = {
      dimension: variables.main[name].dimension
    }

    return {error:false, result}
  }
  else return {error:true, result:[{reason:'undefined-variable', name}]}
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

const add_var_info = curry((invocation, varinfo) => {
  return {error: false, result: mergeObjs(invocation, varinfo)}
})


function is_builtin (name) {
  return name == 'escribir' || name == 'escribir_linea' || name == 'leer'
}
