export const Integer = {
  kind: 'atomic',
  atomic: 'entero'
}

export const Float = {
  kind: 'atomic',
  atomic: 'real'
}

export const Bool = {
  kind: 'atomic',
  atomic: 'logico'
}

export const Char = {
  kind: 'atomic',
  atomic: 'caracter'
}

export const None = {
  kind: 'atomic',
  atomic: 'ninguno'
}

export class ArrayType {
  constructor(element_type, length) {
    this.kind = 'array'
    this.length = length
    this.contains = element_type
  }
}

export class String extends ArrayType {
  constructor(length) {
    super(Char, length)
  }
}

export class FunctionType {
  constructor (return_type, paramtypes) {
    this.kind = 'function',
    this.return_type = return_type
    this.parameters = {
      amount: paramtypes.length,
      types: paramtypes
    }
  }
}

export class ProcedureType {
  constructor (paramtypes) {
    this.kind = 'function',
    this.return_type = None
    this.parameters = {
      amount: paramtypes.length,
      types: paramtypes
    }
  }
}

export const IOType = {
  return_type: None,
  parameter_constraint: type => type instanceof String || is_atomic(type)
}


function is_atomic (type) {
  return type.kind == 'atomic'
}

export function equals(type_a, type_b) {
  if (type_a.kind != type_b.kind) return false
  else
    if (type_a instanceof ArrayType) return array_equality(type_a, type_b)
    else return atomic_equality(type_a, type_b)
}

function array_equality (a, b) {
  if (a.length == b.length) {
    return equals(a.contains, b.contains)
  }
  else return false
}

function atomic_equality (a, b) {
  if (a.atomic == b.atomic && equal_dimensions(a, b)) return true
  else return false
}

export function equal_dimensions(type_a, type_b) {
  if (type_a.dimensions == type_b.dimensions) {
    for (let i = 0; i < type_a.dimensions; i++) {
      if (type_a.dimensions_sizes[i] != type_b.dimensions_sizes[i]) {
        return false
      }
    }
    return true
  }
  return false
}
