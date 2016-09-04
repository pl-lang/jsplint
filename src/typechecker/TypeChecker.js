import {last} from 'ramda'

import * as Types from './Types.js'

const equals = Types.equals

export function check (modules) {
  let errors_found = []

  for (let module_name in modules) {
    let module = modules[module_name]
    let report = check_module(module)
    if (report.error) errors_found.push(...report.result)
  }

  return errors_found
}

function check_module (module) {
  switch (module.module_type) {
    case 'main':
    case 'procedure':
      return check_procedure(module)
    case 'function':
      return check_function(module)
  }
}

function check_procedure (procedure) {
  let errors_found = []

  for (let statement of procedure.body) {
    let report = check_statement(statement)

    if (report.error) {
      if (statement.result instanceof Array) errors_found.push(...report.result)
      else errors_found.push(report.result)
    }
  }

  let error = errors_found.length > 0

  return {error, result:errors_found}
}

function check_function (func) {
  let errors_found = []

  for (let statement of func.body) {
    let report = check_statement(statement)

    if (report.error) {
      if (statement.result instanceof Array) errors_found.push(...report.result)
      else errors_found.push(report.result)
    }
  }

  let return_exp_type = calculate_type(last(func.body).exptype)

  if (!return_exp_type.error) {
    if (!Types.equals(func.type.return_type, return_exp_type.result)) {
      let error_info = {
        reason: '@function-bad-return-type',
        expected: stringify(func.type.return_type),
        returned: stringify(return_exp_type.result)
      }
      errors_found.push(error_info)
    }
  }
  else errors_found.push(return_exp_type.result)

  let error = errors_found.length > 0

  return {error, result:errors_found}
}

export function check_statement (statement) {
  switch (statement.type) {
    case 'call':
      return call_rule(statement)
    case 'assignment':
      return assignment_rule(statement)
    case 'control':
      return ctrl_rule(statement)
    case 'return':
      return {error:false}
    default:
      throw new Error(`@TypeChecker: no se como verificar enunciados de tipo ${statement.type}`)
  }
}

export function assignment_rule (assignment) {
  let variable_type = invocation_rule(assignment.left)

  if (variable_type.error) return variable_type

  let type_report = calculate_type(assignment.right)

  if (type_report.error) return type_report

  let right_type = type_report.result

  if (equals(variable_type.result, right_type)) return {error:false}

  else if (right_type.atomic == 'entero' && variable_type.result.atomic == 'real') {
    if (equal_dimensions(variable_type.result, right_type)) return {error:false}
    else {
      // TODO: cambiar nombre de error por @incompatible-types-at-assignment
      let reason = 'incompatible-types-at-assignment'
      let expected = stringify(variable_type.result)
      let received = stringify(right_type)
      return {error:true, result:{reason, expected, received}}
    }
  }

  else {
    let reason = 'incompatible-types-at-assignment'
    let expected = stringify(variable_type.result)
    let received = stringify(right_type)
    return {error:true, result:{reason, expected, received}}
  }
}

export function call_rule (call) {
  if (call.argtypes.length != call.type_info.parameters.amount) {
    let reason = '@call-incorrect-arg-number'
    let expected = call.type_info.parameters.amount
    let received = call.argtypes.length
    return {error:true, result:{reason, expected, received}}
  }

  let argument_types = []

  for (let i = 0; i < call.argtypes.length; i++) {
    let type = calculate_type(call.argtypes[i])
    if (type.error) return type
    argument_types.push(type.result)
  }

  for (let i = 0; i < argument_types.length; i++) {
    let expected_type = call.type_info.parameters.types[i]

    if (!equals(argument_types[i], expected_type)) {
      let reason = '@call-wrong-argument-type'
      let expected = stringify(expected_type)
      let received = stringify(argument_types[i])
      let at = i + 1

      return {error:true, result:{reason, expected, received, at}}
    }
  }

  return {error:false, result:call.type_info.return_type}
}

export function invocation_rule (invocation) {
  let error = false

  let errors_found = []

  let indexnum = 1

  for (let type_expression of invocation.indextypes) {
    let type_report = calculate_type(type_expression)

    if (type_report.error) return type_report

    if (!equals(Types.Integer, type_report.result)) {
      error = true
      let error_info = {
        reason:'non-integer-index', at:indexnum, bad_type:stringify(type_report.result)
      }
      errors_found.push(error_info)
    }
    indexnum++
  }

  if (error) return {error, result:errors_found}
  else return {error, result:invocation.type}
}

export function ctrl_rule (ctrl_statement) {
  let errors_found = []

  let condition_type = calculate_type(ctrl_statement.condition)
  
  if (!condition_type.error) {
    if (!equals(condition_type.result, Types.Bool)) {
      let reason = '@condition-invalid-expression'
      let unexpected = stringify(condition_type.result)
      return {error:true, result:{reason, unexpected}}
    }
  }
  else errors_found.push(condition_type.result)

  for (let statement of ctrl_statement.body) {
    let report = check_statement(statement)
    if (report.error) {
      if (statement.type == 'control')  errors_found.push(...report.result)
      else errors_found.push(report.result)
    }
  }

  return errors_found
}

// el argumento de esta funcion es un arreglo de tipos y operadores
// su tarea es reducir ese arreglo a un tipo
export function calculate_type (expression) {
  let stack = []

  for (let elt of expression) {
    if (elt.kind == 'operator') {
      let report = apply_operator(stack, elt.name)
      if (report.error) return report
      stack = report.result
    }
    else if (elt.kind == 'call') {
      let report = call_rule(elt.type_info)
      if (report.error) return report
      stack.push(report.result)
    }
    else if (elt.kind == 'invocation') {
      let report = invocation_rule(elt.type_info)
      if (report.error) return report
      stack.push(report.result)
    }
    else stack.push(elt.type_info)
  }

  return {error:false, result:stack.pop()}
}

function apply_operator (stack, opname) {
  switch (opname) {
    case 'plus':
    case 'times':
    case 'power':
    return real_operators(stack)
    case 'divide':
    return division(stack)
    case 'minus':
    return minus(stack)
    case 'mod':
    case 'div':
    return integer_operators(stack)
    case 'equal':
    case 'diff-than':
    case 'major-than':
    case 'minor-than':
    case 'major-equal':
    case 'minor-equal':
     return comparison_operators(stack)
    case 'and':
    case 'or':
    return binary_logic_operators(stack)
    case 'not':
    return not(stack)
    default:
    throw new Error(`No se como verificar los tipos del operador ${opname}`)
  }
}

function division (stack) {
  let booth_are_integers = false

  let new_stack = stack

  let a = new_stack.pop()

  let b = new_stack.pop()

  if (!equals(a, Types.Integer) && !equals(a, Types.Float)) {
    let reason = '@expression-incompatible-operator-type'
    let unexpected = stringify(a)
    return {error:true, result:{reason, unexpected}}
  }

  if (!equals(b, Types.Integer) && !equals(b, Types.Float)) {
    let reason = '@expression-incompatible-operator-type'
    let unexpected = stringify(b)
    return {error:true, result:{reason, unexpected}}
  }

  new_stack.push(Types.Float)

  return {error:false, result:new_stack}
}

function minus (stack) {
  let new_stack = stack
  let a = new_stack.pop()

  if (!equals(a, Types.Integer) && !equals(a, Types.Float)) {
    let reason = '@expression-incompatible-operator-type'
    let unexpected = stringify(a)
    return {error:true, result:{reason, unexpected}}
  }

  // hay que devolver el mismo tipo de dato que se recibio
  new_stack.push(a)

  return {error:false, result:new_stack}
}

function real_operators (stack) {
  let new_stack = stack

  let a = new_stack.pop()
  let b = new_stack.pop()

  let a_is_integer = equals(a, Types.Integer)
  let b_is_integer = equals(b, Types.Integer)

  let a_is_float = equals(a, Types.Float)
  let b_is_float = equals(b, Types.Float)

  if (!a_is_integer && !a_is_float) {
    let reason = '@expression-incompatible-operator-types'
    let unexpected = stringify(a)
    return {error:true, result:{reason, unexpected}}
  }

  if (!b_is_integer && !b_is_float) {
    let reason = '@expression-incompatible-operator-types'
    let unexpected = stringify(b)
    return {error:true, result:{reason, unexpected}}
  }

  let return_type = a_is_integer && b_is_integer ? Types.Integer:Types.Float

  new_stack.push(return_type)

  return {error:false, result:new_stack}
}

function integer_operators (stack) {
  let new_stack = stack

  let a = new_stack.pop()
  let b = new_stack.pop()

  if (!equals(a, Types.Integer)) {
    let reason = '@expression-incompatible-operator-types'
    let unexpected = stringify(a)
    return {error:true, result:{reason, unexpected}}
  }

  if (!equals(b, Types.Integer)) {
    let reason = '@expression-incompatible-operator-types'
    let unexpected = stringify(b)
    return {error:true, result:{reason, unexpected}}
  }

  new_stack.push(Types.Integer)

  return {error:false, result:new_stack}
}

function comparison_operators (stack) {
  let new_stack = stack

  let a = new_stack.pop()
  let b = new_stack.pop()

  if (!equals(a, b)) {
    if (equals(a, Types.Integer) || equals(a, Types.Float)) {
      if (!equals(b, Types.Integer) && !equals(b, Types.Float)) {
        let reason = '@expression-incompatible-comparison'
        let first = stringify(a)
        let second = stringify(b)
        return {error:true, result:{reason, first, second}}
      }
    }
    else {
      let reason = '@expression-incompatible-comparison'
      let first = stringify(a)
      let second = stringify(b)
      return {error:true, result:{reason, first, second}}
    }
  }

  new_stack.push(Types.Bool)

  return {error:false, result:new_stack}
}

function binary_logic_operators (stack) {
  let new_stack = stack

  let a = new_stack.pop()
  let b = new_stack.pop()

  if (!equals(a, Types.Bool)) {
    let reason = '@expression-incompatible-operator-types'
    let unexpected = stringify(a)
    return {error:true, result:{reason, unexpected}}
  }

  if (!equals(b, Types.Bool)) {
    let reason = '@expression-incompatible-operator-types'
    let unexpected = stringify(b)
    return {error:true, result:{reason, unexpected}}
  }

  new_stack.push(Types.Bool)

  return {error:false, result:new_stack}
}

function not (stack) {
  let new_stack = stack
  let a = new_stack.pop()

  if (!equals(a, Types.Bool)) {
    let reason = '@expression-incompatible-operator-type'
    let unexpected = stringify(a)
    return {error:true, result:{reason, unexpected}}
  }

  new_stack.push(Types.Bool)

  return {error:false, result:new_stack}
}

function stringify (type) {
  if (type.kind == 'array') {
    let dimensions = ''
    let ct = type
    while (ct.kind == 'array') {
      dimensions += ct.length
      if (ct.contains.kind == 'array') dimensions += ', '
    }
    return `${ct.atomic}[${dimensions}]`
  }
  else {
    return type.atomic
  }
}
