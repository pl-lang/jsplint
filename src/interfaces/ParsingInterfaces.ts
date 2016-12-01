import {ValueKind, ReservedKind, SymbolKind, OtherKind, Token} from '../parser/TokenTypes'

export type TokenKind = ValueKind | ReservedKind | SymbolKind | OtherKind

export type DataTypeKind = ReservedKind.Entero | ReservedKind.Real | ReservedKind.Logico | ReservedKind.Caracter

export type TypeNameString = 'entero' | 'real' | 'logico' | 'caracter'

export type ExpValue = LiteralValue  | InvocationValue | Call

export type Statement = Call | Assignment | If | While | For | Until | Return | Declaration

export type Module = Main | Function | Procedure

export interface PatternError {
  unexpected: ValueKind | ReservedKind | SymbolKind | OtherKind,
  expected: string[],
  column: number,
  line: number,
  reason?: string
}

export interface NumberInfo {
  value: number,
  type: ValueKind.Integer | ValueKind.Real
}

export interface DeclarationInfo {
  name: string
  is_array: boolean
  dimensions: number[] 
}

export interface InvocationInfo {
  name: string
  is_array: boolean
  indexes: ExpElement[][]
}

/**
 * Representa un elemento de una expresion
 */
export interface ExpElement {
  type: 'invocation' | 'literal' | 'operator' | 'parenthesis' | 'call'
  name?: string
}

export interface LiteralValue {
  type: 'literal'
  value: boolean | string | number
}

export interface InvocationValue {
  type: 'invocation'
  name: string
  is_array: boolean
  indexes: ExpElement[][]
}

export interface Parameter {
  name: string
  by_ref: boolean
  type: TypeNameString
}

export interface Call {
  type: 'call'
  args: ExpElement[][]
  name: string
}

export interface Assignment {
  type: 'assignment'
  left: InvocationInfo
  right: ExpElement[]
}

export interface If {
  type: 'if'
  condition: ExpElement[]
  true_branch: Statement[]
  false_branch: Statement[]
}

export interface While {
  type: 'while'
  condition: ExpElement[]
  body: Statement[]
}

export interface For {
  type: 'for'
  counter_init: Assignment
  last_value: ExpElement[]
  body: Statement[]
}

export interface Until {
  type: 'until'
  condition: ExpElement[]
  body: Statement[]
}

export interface Return {
  type: 'return'
  expression: ExpElement[]
}

export interface TypedDeclaration extends DeclarationInfo {
  datatype: string
}

export interface Declaration {
  type: 'declaration'
  variables: TypedDeclaration[]
}

export interface Main {
  type: 'module'
  name: 'main'
  module_type: 'main'
  body: Statement[]
}

export interface Function {
  type: 'module'
  module_type: 'function'
  name: string
  parameters: Parameter[]
  body: Statement[]
  return_type: string
}

export interface Procedure {
  type: 'module'
  module_type: 'procedure'
  name: string
  parameters: Parameter[]
  body: Statement[]
}

export interface ParsedProgram {
  main: Main
  [m: string]: Module
}