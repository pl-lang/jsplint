'use strict'

import {curry, map, drop} from 'ramda'

import {bind, bindN} from '../utility/helpers.js'

import * as Types from '../typechecker/Types.js'

export default function transform (ast) {
  let output = {}
  let errors_found = []

  for (let module_name in ast.modules) {
    let old_module = ast.modules[module_name]
    let new_module = transform_module(old_module, ast, module_name)
    if (new_module.error) errors_found.push(...new_module.result)
    else output[module_name] = new_module.result
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function transform_module (module, ast, module_name) {
  let output = {body:[], module_type:module.module_type, name:module.name}
  let errors_found = []

  for (let statement of module.body) {
    let new_statement = transform_statement(statement, ast, module_name)
    if (new_statement.error) errors_found.push(...new_statement.result)
    else output.body.push(new_statement.result)
  }

  if (module.module_type == 'function')
    output.type = type_module(module.module_type, module.parameters, module.return_type)

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function transform_statement (statement, ast, module_name) {
  switch (statement.type) {
    case 'assignment':
      return transform_assignment(statement, ast, module_name)
    case 'call':
      return transform_call(statement, ast, module_name)
    case 'for':
      return transform_for(statement, ast, module_name)
    case 'until':
    case 'while':
      return transform_ctrl_stmnt(statement, ast, module_name)
    case 'if':
      return transform_if(statement, ast, module_name)
    case 'return':
      return type_return(statement, ast, module_name)
    default:
      throw new Error(`@Typer: no se puede transformar un enunciado "${statement.type}"`)
  }
}

function transform_for (for_statement, ast, module_name) {
  let errors_found = []

  let output = {
    type: 'for_loop',
    body: [],
    init_value: null,
    last_value: null,
    counter_invocation: null
  }

  for (let statement of for_statement.body) {
    let new_statement = transform_statement(statement, ast, module_name)
    if (new_statement.error) errors_found.push(...new_statement.result)
    else output.body.push(new_statement.result)
  }

  let init_type = type_expression(module, for_statement.counter_init.right)

  if (init_type.error)
    errors_found.push(...init_type.result)
  else
    output.init_value = init_type.result

  // counter_variable
  let cv = get_var(for_statement.counter_init.left.name, ast, module_name)

  let counter_invocation = bind(type_var(ast, module_name, for_statement.counter_init.left), cv)

  if (counter_invocation.error)
    errors_found.push(...counter_invocation.result)
  else
    output.counter_invocation = counter_invocation.result

  let last_type = type_expression(module, for_statement.last_value)

  if (last_type.error)
    errors_found.push(...last_type.result)
  else
    output.last_value = last_type.result

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function transform_ctrl_stmnt (ctrl_statement, ast, module_name) {
  let errors_found = []

  let output = {type:'control', body:[]}

  for (let statement of ctrl_statement.body) {
    let new_statement = transform_statement(statement, ast, module_name)
    if (new_statement.error) errors_found.push(...new_statement.result)
    else output.body.push(new_statement.result)
  }

  let new_condition = type_expression(ast, ctrl_statement.condition, module_name)

  if (new_condition.error) errors_found.push(...new_condition.result)
  else output.condition = new_condition.result

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function transform_if (if_statement, ast, module_name) {
  let errors_found = []

  let output = {type:'control', body:[]}

  for (let statement of if_statement.true_branch) {
    let new_statement = transform_statement(statement, ast, module_name)
    if (new_statement.error) errors_found.push(...new_statement.result)
    else output.body.push(new_statement.result)
  }

  for (let statement of if_statement.false_branch) {
    let new_statement = transform_statement(statement, ast, module_name)
    if (new_statement.error) errors_found.push(...new_statement.result)
    else output.body.push(new_statement.result)
  }

  let new_condition = type_expression(ast, if_statement.condition, module_name)

  if (new_condition.error) errors_found.push(...new_condition.result)
  else output.condition = new_condition.result

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function transform_assignment (assignment, ast, module_name) {
  let variable = get_var(assignment.left.name, ast, module_name)

  let vartype = bind(type_var(ast, module_name, assignment.left), variable)

  let payload_type = type_expression(ast, assignment.right, module_name)

  // make_assignment(vartype, payload_type)
  return bindN(make_assignment, vartype, payload_type)
}

function transform_call (call, ast, module_name) {
  let type_info

  if (is_builtin(call.name))
    type_info = Types.IOType
  else
    type_info = type_module(call.module_type, call.parameters, call.return_type)

  let argtypes = type_exp_array(ast, call.args, module_name)

  // return {type:'call', argtypes}
  return bind(make_call(call.name, type_info), argtypes)
}

function type_module (mtype, parameters, return_type) {
  let paramtypes = map(p => atomic_type(p.type), parameters)

  if (mtype == 'function')
    return new Types.FunctionType(atomic_type(return_type), paramtypes)
  else
    return new Type.ProcedureType(paramtypes)
}

function type_return (statement, ast, module_name) {
  let exptype = type_expression(ast, statement.expression, module_name)

  return bind(make_return, exptype)
}

function type_exp_array (ast, es, module_name) {
  let errors_found = []
  let output = []

  for (let e of es) {
    let report = type_expression(ast, e, module_name)
    if (report.error) errors_found.push(...report.result)
    else output.push(report.result)
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function type_expression (ast, expression, module_name) {
  let output = []
  let errors_found = []

  for (let token of expression) {
    if (token.type == 'operator') {
      output.push({kind:'operator', name:token.name})
    }
    else {
      let type_info
      switch (token.type) {
        case 'literal':
          type_info = type_literal(token.value)
          break
        case 'invocation':
          {
            let variable = get_var(token.name, ast, module_name)
            // type_info = type_var >>= module >>= variable >>= token
            type_info = bind(type_var(ast, module_name, token), variable)
          }
          break
        case 'call':
          type_info = transform_call(token, ast, module_name)
          break
        default:
          throw new Error(`@Typer: tipo de expresion ${token.type} desconocido`)
      }
      if (type_info.error) errors_found = [...errors_found, ...type_info.result]
      else output.push({kind:token.type, type_info:type_info.result})
    }
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

const type_var = curry((ast, module_name, invocation, variable) => {
  // Report [Num]
  // size per dimension
  let dimension_sizes = calculate_sizes(invocation, variable)

  // Report Type
  // the type of the value this invocation returns
  let type = bind(make_type(variable.type), dimension_sizes)

  // [Report ExpStack]
  // the type of the indexes in this invocation
  let indextypes = type_exp_array(ast, invocation.indexes, module_name)

  return bindN(make_inv, type, indextypes)
})

function type_literal (literal) {
  let type

  if (typeof literal == 'string') {
    if (literal.length > 1)
      type = new Types.String(literal.length)
    else
      type = Types.Char
  }
  else if (typeof literal == 'boolean') type = Types.Bool
  else if (is_int(literal))             type = Types.Integer
  else if (is_float(literal))           type = Types.Float
  else throw new Error(`@Typer: no puedo tipar el literal ${literal}`)

  return {error:false, result:type}
}

function atomic_type (typename) {
  switch (typename) {
    case 'entero':
      return Types.Integer
    case 'real':
      return Types.Float
    case 'logico':
      return Types.Bool
    case 'caracter':
      return Types.Char
    case 'none':
      return Types.None
    default:
      throw new Error(`@Typer: tipo atomico "${tn}" desconocido`)
  }
}

function calculate_sizes (i, v) {
  if (i.indexes.length > v.dimension.length) {
    let result = [{
      reason: '@invocation-too-many-indexes',
      expected: v.dimension.length,
      received: i.indexes.length
    }]
    return {error:true, result}
  }
  else {
    let result = drop(i.indexes.length, v.dimension)
    return {error:false, result}
  }
}

function is_int (value) {
  return value === Math.trunc(value)
}

function is_float (value) {
  return value - Math.trunc(value) > 0
}

function get_var (name, ast, module_name) {
  let error = !(name in ast.local_variables[module_name] || name in ast.local_variables.main)

  if (!error) {
    if (name in ast.local_variables[module_name])
      return {error:false, result: ast.local_variables[module_name][name]}
    else
      return {error:false, result: ast.local_variables.main[name]}
  }
  else
    return {error, result:[{reason:'undefined-variable', name}]}
}

const make_call = curry((name, type_info, argtypes) => {
  return {error:false, result:{type:'call', name, argtypes, type_info}}
})

const make_assignment = curry((left, right) => {
  let result = {type:'assignment', left, right}
  return {error:false, result}
})

const make_return = curry((exptype) => {
  return {error:false, result:{type:'return', exptype}}
})

const make_inv = curry((type, indextypes) => {
  return {error:false, result:{type, indextypes}}
})

const make_type = curry((tn, sizes) => {
  if (sizes.length == 0) {
    return {error:false, result:atomic_type(tn)}
  }
  else {
    let result
    for (let i = sizes.length - 1; i >= 0; i--) {
      if (i == sizes.length - 1)
        result = new Types.ArrayType(atomic_type(tn), sizes[i])
      else
        result = new Types.ArrayType(result, sizes[i])
    }
    return {error:false, result}
  }
})

function is_builtin (name) {
  return name == 'escribir' || name == 'escribir_linea' || name == 'leer'
}
