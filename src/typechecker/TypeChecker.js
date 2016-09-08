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
      switch (statement.name) {
        case 'escribir':
        case 'escribir_linea':
        case 'leer':
          return io_rule(statement)
        default:
          return call_rule(statement)
      }
    case 'assignment':
      return assignment_rule(statement)
    case 'for_loop':
      return for_rule(statement)
    case 'control':
      return ctrl_rule(statement)
    case 'return':
      return {error:false}
    default:
      throw new Error(`@TypeChecker: no se como verificar enunciados de tipo ${statement.type}`)
  }
}

// assignment_error:: error_report
//
// Informacion sobre los errores encontrados en la asignacion a una variable
//
//  reason: 'assignment-error'
//
//  errors: [error]
//  Arreglo con todos los errores encontrados en el llamado
//
// :: (assignment) -> report<assignment_error, type>
// Encuentra errores en una asignacion a una variable
export function assignment_rule (assignment) {
  let errors = []

  let variable_type = invocation_rule(assignment.left)

  let type_report = calculate_type(assignment.right)

  if (variable_type.error) errors.push(variable_type.result)

  if (type_report.error) errors.push(type_report.result)

  let error = errors.length > 0

  if (error) {
    let result = {reason: 'assignment-error', errors}
    return {error, result}
  }
  else {
    let right_type = type_report.result

    if (equals(variable_type.result, right_type)) {
      return {error:false}
    }

    if (right_type.atomic == 'entero' && variable_type.result.atomic == 'real')
      if (equal_dimensions(variable_type.result, right_type)) {
        return {error:false}
      }

    let reason = '@assignment-incompatible-types'
    let expected = stringify(variable_type.result)
    let received = stringify(right_type)
    errors.push({reason, expected, received})

    let result = {reason: 'assignment-error', errors}

    return {error:true, result}
  }
}

// call_error:: error_report
//
// Informacion sobre los errores encontrados en el llamado a un modulo
//
//  reason: '@call-errors-found'
//
//  name: string
//  Nombre del modulo llamado
//
//  errors: [error]
//  Arreglo con todos los errores encontrados en el llamado
//
// :: (call) -> report<call_error, type>
// Encuentra errores en una llamada a un modulo
export function call_rule (call) {
  let errors = []

  // ver si se llamó al modulo con la cantidad correcta de argumentos
  if (call.argtypes.length != call.type_info.parameters.amount) {
    let reason = '@call-incorrect-arg-number'
    let expected = call.type_info.parameters.amount
    let received = call.argtypes.length
    errors.push({reason, expected, received})
  }

  // calcular los tipos de los argumentos
  let argument_types = []
  for (let i = 0; i < call.argtypes.length; i++) {
    let type = calculate_type(call.argtypes[i])
    if (type.error) errors.push(type.result)
    argument_types.push(type.result)
  }

  // verificar que los tipos de los argumentos coincidan con los tipos de los
  // parametros
  for (let i = 0; i < argument_types.length; i++) {
    let expected_type = call.type_info.parameters.types[i]

    if (!equals(argument_types[i], expected_type)) {
      let reason = '@call-wrong-argument-type'
      let expected = stringify(expected_type)
      let received = stringify(argument_types[i])
      let at = i + 1

      errors.push({reason, expected, received, at})
    }
  }

  let error = errors.length > 0

  // Si se encontro algun error se retorna informacion sobre ellos
  // si no se retorna el tipo de retorno declarado por el modulo
  let result
  if (error) {
    let reason = '@call-errors-found'
    let name = call.name
    result = {reason, name, errors}
  }
  else
    result = call.type_info.return_type

  return {error, result}
}

// io_error:: error_report
//
// Informacion sobre los errores encontrados en el llamado a un modulo de IO
//
//  reason: '@io-errors-found'
//
//  name: string
//  Nombre del modulo llamado (escribir, escribir_linea, leer)
//
//  errors: [error]
//  Arreglo con todos los arreglos encontrados en el llamado
//
// :: (call) -> report<io_error, type>
// Encuentra errores en una llamada a un modulo
function io_rule (call) {
  let errors = []

  let argument_types = []

  for (let i = 0; i < call.argtypes.length; i++) {
    let type = calculate_type(call.argtypes[i])
    if (type.error) errors.push(type.result)
    argument_types.push(type.result)
  }

  let constraint = call.type_info.parameter_constraint

  for (let i = 0; i < argument_types.length; i++) {
    if (!constraint(argument_types[i])) {
      let reason = '@io-wrong-argument-type'
      let received = stringify(argument_types[i])
      let name = call.name
      let at = i + 1

      errors.push({reason, received, at})
    }
  }

  let error = errors.length > 0

  let result
  if (error) {
    let reason = '@io-errors-found'
    let name = call.name
    result = {reason, name, errors}
  }
  else
    result = call.type_info.return_type

  return {error, result}
}

function for_rule (for_loop) {
  let errors_found = []

  let counter_type = invocation_rule(for_loop.counter_invocation)

  if (counter_type.error) return counter_type

  let init_value_type =  calculate_type(for_loop.init_value)

  if (init_value_type.error) return init_value_type

  let last_value_type =  calculate_type(for_loop.last_value)

  if (last_value_type.error) return last_value_type

  if (!equals(Types.Integer, counter_type.result)) {
    let error_info = {
      reason: '@for-non-integer-counter',
      received: stringify(counter_type.result)
    }
    errors_found.push(error_info)
  }

  if (!equals(Types.Integer, init_value_type.result)) {
    let error_info = {
      reason: '@for-non-integer-init',
      received: stringify(init_value_type.result)
    }
    errors_found.push(error_info)
  }

  if (!equals(Types.Integer, last_value_type.result)) {
    let error_info = {
      reason: '@for-non-integer-goal',
      received: stringify(last_value_type.result)
    }
    errors_found.push(error_info)
  }

  for (let statement of for_loop.body) {
    let report = check_statement(statement)
    if (report.error) {
      if (statement.type == 'control')  errors_found.push(...report.result)
      else errors_found.push(report.result)
    }
  }

  if (errors_found.length > 0)
    return {error:true, result:errors_found}
  else
    return {error:false}
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
      let received = stringify(condition_type.result)
      return {error:true, result:{reason, received}}
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
    let reason = '@expression-incompatible-type'
    let received = stringify(a)
    return {error:true, result:{reason, received}}
  }

  if (!equals(b, Types.Integer) && !equals(b, Types.Float)) {
    let reason = '@expression-incompatible-type'
    let received = stringify(b)
    return {error:true, result:{reason, received}}
  }

  new_stack.push(Types.Float)

  return {error:false, result:new_stack}
}

function minus (stack) {
  let new_stack = stack
  let a = new_stack.pop()

  if (!equals(a, Types.Integer) && !equals(a, Types.Float)) {
    let reason = '@expression-incompatible-type'
    let received = stringify(a)
    return {error:true, result:{reason, received}}
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
    let reason = '@expression-incompatible-types'
    let received = stringify(a)
    return {error:true, result:{reason, received}}
  }

  if (!b_is_integer && !b_is_float) {
    let reason = '@expression-incompatible-types'
    let received = stringify(b)
    return {error:true, result:{reason, received}}
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
    let reason = '@expression-incompatible-types'
    let received = stringify(a)
    return {error:true, result:{reason, received}}
  }

  if (!equals(b, Types.Integer)) {
    let reason = '@expression-incompatible-types'
    let received = stringify(b)
    return {error:true, result:{reason, received}}
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
    let reason = '@expression-incompatible-types'
    let received = stringify(a)
    return {error:true, result:{reason, received}}
  }

  if (!equals(b, Types.Bool)) {
    let reason = '@expression-incompatible-types'
    let unexpected = stringify(b)
    return {error:true, result:{reason, received}}
  }

  new_stack.push(Types.Bool)

  return {error:false, result:new_stack}
}

function not (stack) {
  let new_stack = stack
  let a = new_stack.pop()

  if (!equals(a, Types.Bool)) {
    let reason = '@expression-incompatible-type'
    let received = stringify(a)
    return {error:true, result:{reason, received}}
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
      ct = ct.contains
    }
    return `${ct.atomic}[${dimensions}]`
  }
  else {
    return type.atomic
  }
}
