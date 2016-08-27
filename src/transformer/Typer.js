'use strict'

import * as Types from '../typechecker/Types.js'

import {curry} from 'ramda'

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

  let vartype = bind(type_var(assignment.left), variable)

  let payload_type = type_expression(assignment.right)

  // make_assignment >>= vartype >>= payload_type
  return bind(bind(make_assignment, vartype), payload_type)
}

const make_assignment = curry((left, right) => {
  let result = {type:'assignment', left, right}
  return {error:false, result}
})

function transform_call (call, module) {
  let args = []

  for (let argument of call.args) {
    let type = this.type_expression(arg, module)
    args.push(type)
  }

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

function type_expression (expression, module) {
  let result = []

  for (let token of expression) {
    if (this.is_operator(token.type)) {
      result.push({kind:'operator', name:token.name})
    }
    else {
      let wrapper
      switch (token.type) {
        case 'literal':
          wrapper = {kind:'type', type:this.type_literal(token.value)}
          break
        case 'invocation':
          wrapper = {kind:'invocation', invocation:this.type_var(module.locals[token.name], token)}
          break
        case 'call':
          wrapper = {kind:'call', call:this.transform_call(token, module)}
          break
        default:
          throw new Error(`@Typer: tipo de expresion ${token.type} desconocido`)
      }
      result.push(wrapper)
    }
  }

  return result
}

function type_var (variable, invocation) {
  // result = {type, indextypes}
  let dimension_sizes
  let indextypes = []
  if (variable.isArray) {
    if (variable.dimension.length == invocation.indexes.length) {
      dimension_sizes = [1]
    }
    else if (invocation.indexes.length < variable.dimension.length) {
      dimension_sizes = variable.dimension.slice(invocation.indexes.length)
    }
    else throw new Error('@Typer: invocando variable con demasiados indices')

    for (let index of invocation.indexes)
      indextypes.push(this.type_expression(index))
  }
  else {
    dimension_sizes = [1]
    indextypes.push(new Types.IntegerType([1]))
  }

  let type
  switch (variable.type) {
    case 'entero':
      type = new Types.IntegerType(dimension_sizes)
      break
    case 'real':
      type = new Types.FloatType(dimension_sizes)
      break
    case 'logico':
      type = new Types.BoolType(dimension_sizes)
      break
    case 'caracter':
      type = new Types.CharType(dimension_sizes)
      break
    default: throw new Error(`@Typer: tipo atomico "${variable.type}" desconocido`)
  }

  return {type, indextypes}
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
  if (typeof literal == 'string') return new Types.CharType([literal.length])
  else if (typeof literal == 'boolean') return new Types.BoolType([1])
  else if (this.is_int(literal)) return new Types.IntegerType([1])
  else if (this.is_float(literal)) return new Types.FloatType([1])
  else throw new Error(`@Typer: no puedo tipar el literal ${literal}`)
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
