'use strict'

import * as Types from '../typechecker/Types.js'

import {curry, map} from 'ramda'

function transform (input) {
  let output = {}
  let errors_found = []

  for (let module of input) {
    let old_module = module

    let new_module = { name: module.name, body: [] }

    for (let statement of module.body) {
      let new_statement = transform_statement(statement, module)
      if (new_statement.error) errors_found.push(new_statement.result)
      else output[module.name] = new_module
    }
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

function transform_statement (statement, module) {
  switch (statement.type) {
    case 'assignment':
      return this.transform_assignment(statement, old_module)
    case 'call':
      return this.transform_call(statement, old_module)
    case 'for':
    case 'until':
    case 'while':
    case 'if':
      return this.transform_ctrl_stmnt(statement, old_module)
    default:
      throw new Error(`@Typer: no se puede transformar un enunciado "${statement.type}"`)
  }
}

function transform_ctrl_stmnt (ctrl_statement, module) {
  let result = {type:'control', body:[]}

  for (let statement of ctrl_statement.body)
    result.body.push(this.transform_statement(statement, module))

  result.condition_type = this.type_expression(ctrl_statement.condition)

  return result
}

function transform_assignment (assignment, module) {
  let variable = get_var(assignment.left.name, module.locals)

  let vartype = bind(type_var(module, assignment.left), variable)

  let payload_type = type_expression(assignment.right)

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

  let argtypes = []
  let parameters = module.parameters
  for (let parameter of parameters) {
    let type = this.type_var(parameter)
    // TODO: cambiar argtypes a paramtypes
    argtypes.push(type)
  }

  let return_type = this.type_return(module.return_type)

  return {type:'call', argtypes, args, return_type}
}

function type_expression (module, expression) {
  let output = []
  let errors_found = []

  for (let token of expression) {
    if (this.is_operator(token.type)) {
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
            type_info = bind(bind(type_var(module), variable), token)
          }
          break
        case 'call':
          type_info = transform_call(token, module)
          break
        default:
          throw new Error(`@Typer: tipo de expresion ${token.type} desconocido`)
      }
      if (type_info.error) errors_found = [...errors_found, ...type_info.result]
      else output.push({kind:token.type, result:type_info.result})
    }
  }

  let error = errors_found.length > 0
  let result = error ? errors_found:output

  return {error, result}
}

const type_var = curry((module, variable, invocation) => {
  // Report [Num]
  // size per dimension
  let dimension_sizes = calculate_sizes(variable, invocation)

  // Report Type
  // the type of the value this invocation returns
  let type = bind(make_type(typename), dimension_sizes)

  // [Report ExpStack]
  // the type of the indexes in this invocation
  let indextypes = type_exp_array(module, invocation.indexes)

  return bind(bind(make_inv, type), indextypes)
})

const make_inv = curry((type, index_stacks) => {
  let indextypes = map(r => r.result, index_stacks)
  return {error:false, result:{type, indextypes}}
})

const make_type = curry((tn, sizes) => {
  let type
  switch (tn) {
    case 'entero':
      return {error:false, result:new Types.IntegerType(sizes)}
    case 'real':
      return {error:false, result:new Types.FloatType(sizes)}
    case 'logico':
      return {error:false, result:new Types.BoolType(sizes)}
    case 'caracter':
      return {error:false, result:new Types.IntegerType(sizes)}
    default:
     throw new Error(`@Typer: tipo atomico "${variable.type}" desconocido`)
  }
})

function calculate_sizes (v, i) {
  if (i.indexes.length > v.dimension.length) {
    let result = {
      reason: '@invocation-too-many-indexes',
      expected: v.dimension.length,
      received: i.indexes.length
    }
    return {error:true, result}
  }
  else {
    return {error:false, result:[drop(i.indexes.length, v.dimension])}
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
  let result = error ? errors_found:result

  return {error, result}
}

function type_return (atomic_typename) {
  switch (atomic_typename) {
    case 'entero': return new Types.Integer
    case 'real': return new Types.Float
    case 'logico': return new Types.Bool
    case 'caracter': return new Types.Char
    default:
      throw new Error(`@Typer: no existe el tipo atomico "${atomic_typename}"`)
  }
}

function type_literal (literal) {
  let type

  if (typeof literal == 'string')       type = Types.CharType([literal.length])
  else if (typeof literal == 'boolean') type = Types.BoolType([1])
  else if (this.is_int(literal))        type = Types.IntegerType([1])
  else if (this.is_float(literal))      type = Types.FloatType([1])
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
