'use strict'

import * as Types from '../typechecker/Types.js'

export default class Transformer  {
  constructor (data) {
    this.data = data
  }

  transform(input) {
    let result = {}

    for (let module of input) {
      // let old_module = this.data[module.name]
      let old_module = module

      let new_module = { name: module.name, body: [] }

      for (let statement of module.body) {
        switch (statement.type) {
          case 'assignment':
            new_module.body.push(this.transform_assignment(statement, old_module))
            break;
          case 'call':
            new_module.body.push(this.transform_call(statement, old_module))
            break;
          case 'for':
            new_module.body.push(this.transform_for(statement, old_module))
            break
          case 'until':
            new_module.body.push(this.transform_until(statement, old_module))
            break
          case 'while':
            new_module.body.push(this.transform_while(statement, old_module))
            break
          case 'if':
            new_module.body.push(this.transform_if(statement, old_module))
            break
          default:
            throw new Error(`@Typer: no se puede transformar un enunciado "${statement.type}"`)
        }
      }

      result[module.name] = new_module
    }

    return result
  }

  transform_statement (statement, module) {
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

  transform_ctrl_stmnt (ctrl_statement, module) {
    let result = {type:'control', body:[]}

    for (let statement of ctrl_statement.body)
      result.body.push(this.transform_statement(statement, module))

    result.condition_type = this.type_expression(ctrl_statement.condition)

    return result
  }

  transform_assignment (assignment, module) {
    let target_type = this.type_var(module.locals[assignment.left.name], assignment.left)
    let payload_type = this.type_expression(assignment.right)
    return {type:'assignment', left:target_type, right:payload_type}
  }

  transform_call (call, module) {
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

  type_expression (expression, module) {
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
            wrapper = {kind:'type', type:this.type_var(module.locals[token.name], token)}
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

  type_var (variable, invocation) {
    let dimension_sizes
    if (variable.isArray) {
      if (variable.dimension.length == invocation.indexes.length) {
        dimension_sizes = [1]
      }
      else if (invocation.indexes.length < variable.dimension.length) {
        dimension_sizes = variable.dimension.slice(invocation.indexes.length)
      }
      else throw new Error('@Typer: invocando variable con demasiados indices')
    }
    else {
      dimension_sizes = [1]
    }

    switch (variable.type) {
      case 'entero': return new Types.IntegerType(dimension_sizes)
      case 'real': return new Types.FloatType(dimension_sizes)
      case 'logico': return new Types.BoolType(dimension_sizes)
      case 'caracter': return new Types.CharType(dimension_sizes)
      default: throw new Error(`@Typer: tipo "${variable.type}" desconocido`)
    }
  }

  type_return (atomic_typename) {
    switch (atomic_typename) {
      case 'entero': return new Types.Integer
      case 'real': return new Types.Float
      case 'logico': return new Types.Bool
      case 'caracter': return new Types.Char
      default:
        throw new Error(`@Typer: no existe el tipo atomico "${atomic_typename}"`)
    }
  }

  type_literal (literal) {
    if (typeof literal == 'string') return new Types.CharType([literal.length])
    else if (typeof literal == 'boolean') return new Types.BoolType([1])
    else if (this.is_int(literal)) return new Types.IntegerType([1])
    else if (this.is_float(literal)) return new Types.FloatType([1])
    else throw new Error(`@Typer: no puedo tipar el literal ${literal}`)
  }

  is_int (value) {
    return value === Math.trunc(value)
  }

  is_float (value) {
    return value - Math.trunc(value) > 0
  }

  is_operator (string) {
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
}
