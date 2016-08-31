'use strict'

import {curry, map, drop} from 'ramda'

import {bind} from '../utility/helpers.js'

import * as Types from '../typechecker/Types.js'

export default function transform (modules) {
  let output = {}
  let errors_found = []

  for (let module_name in modules) {
    let module = modules[module_name]

    let verifiable_statements = []

    for (let statement of module.body) {
      let new_statement = transform_statement(statement, module)
      if (new_statement.error) errors_found.push(new_statement.result)
      else verifiable_statements.push(new_statement.result)
    }

    output[module.name] = verifiable_statements
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function transform_statement (statement, module) {
  switch (statement.type) {
    case 'assignment':
      return transform_assignment(statement, module)
    case 'call':
      return transform_call(statement, module)
    case 'for':
    case 'until':
    case 'while':
    case 'if':
      return transform_ctrl_stmnt(statement, module)
    default:
      throw new Error(`@Typer: no se puede transformar un enunciado "${statement.type}"`)
  }
}

function transform_ctrl_stmnt (ctrl_statement, module) {
  let result = {type:'control', body:[]}

  for (let statement of ctrl_statement.body)
    result.body.push(transform_statement(statement, module))

  result.condition_type = type_expression(ctrl_statement.condition)

  return result
}

function transform_assignment (assignment, module) {
  let variable = get_var(assignment.left.name, module.locals)

  let vartype = bind(type_var(module, assignment.left), variable)

  let payload_type = type_expression(module, assignment.right)

  // make_assignment >>= vartype >>= payload_type
  return bind(bind(make_assignment, vartype), payload_type)
}

const make_assignment = curry((left, right) => {
  let result = {type:'assignment', left, right}
  return {error:false, result}
})

// TODO: esta funcion
function transform_call (call, module) {
  let argtypes = type_exp_array(module, call.args)

  let parameters = module.parameters
  for (let parameter of parameters) {
    let type = type_var(parameter)
    // TODO: cambiar argtypes a paramtypes
    argtypes.push(type)
  }

  let return_type = type_return(module.return_type)

  return {type:'call', argtypes, args, return_type}
}

function type_expression (module, expression) {
  let output = []
  let errors_found = []

  for (let token of expression) {
    if (is_operator(token.type)) {
      result.push({kind:'operator', name:token.name})
    }
    else {
      let type_info
      switch (token.type) {
        case 'literal':
          type_info = type_literal(token.value)
          break
        case 'invocation':
          {
            let variable = get_var(token.name, module.locals)
            // type_info = type_var >>= module >>= variable >>= token
            type_info = bind(type_var(module, token), variable)
          }
          break
        case 'call':
          type_info = transform_call(token, module)
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

const type_var = curry((module, invocation, variable) => {
  // Report [Num]
  // size per dimension
  let dimension_sizes = calculate_sizes(invocation, variable)

  // Report Type
  // the type of the value this invocation returns
  let type = bind(make_type(variable.type), dimension_sizes)

  // [Report ExpStack]
  // the type of the indexes in this invocation
  let indextypes = type_exp_array(module, invocation.indexes)

  return bind(bind(make_inv, type), indextypes)
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
    default:
      throw new Error(`@Typer: tipo atomico "${tn}" desconocido`)
  }
}

function calculate_sizes (i, v) {
  if (i.indexes.length > v.dimension.length) {
    let result = {
      reason: '@invocation-too-many-indexes',
      expected: v.dimension.length,
      received: i.indexes.length
    }
    return {error:true, result}
  }
  else {
    let result = drop(i.indexes.length, v.dimension)
    return {error:false, result}
  }
}

function type_exp_array (m, es) {
  let errors_found = []
  let output = []

  for (let e of es) {
    let report = type_expression(m, e)
    if (report.error) errors_found.push(...report.result)
    else output.push(report.result)
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function type_return (atomic_typename) {
  switch (atomic_typename) {
    case 'entero': return Types.Integer
    case 'real': return Types.Float
    case 'logico': return Types.Bool
    case 'caracter': return Types.Char
    default:
      throw new Error(`@Typer: no existe el tipo atomico "${atomic_typename}"`)
  }
}

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

function is_int (value) {
  return value === Math.trunc(value)
}

function is_float (value) {
  return value - Math.trunc(value) > 0
}

function is_operator (string) {
  switch (string) {
    case 'power':
    case 'div':
    case 'mod':
    case 'times':
    case 'divide':
    case 'minus':
    case 'plus':
    case 'minor-than':
    case 'minor-equal':
    case 'major-than':
    case 'major-equal':
    case 'equal':
    case 'diff-than':
    case 'and':
    case 'or':
      return true
    default:
      return false
  }
}

function get_var (name, locals) {
  let error = !(name in locals)

  let result = error ? [{reason:'undefined-variable', name}]:locals[name]

  return {error, result}
}
