import {ValueKind, ReservedKind, SymbolKind, OtherKind, Token} from './TokenTypes'

export type TokenKind = ValueKind | ReservedKind | SymbolKind | OtherKind

export type DataTypeKind = ReservedKind.Entero | ReservedKind.Real | ReservedKind.Logico | ReservedKind.Caracter

export type TypeNameString = 'entero' | 'real' | 'logico' | 'caracter'

export type ExpValue = ILiteralValue  | IInvocationValue | IModuleCall

export type Statement = IModuleCall | IAssignment | IIf | IWhile | IFor | IUntil | IReturn | IDeclarationStatement

export type Module = IMainModule | IFunctionModule | IProcedureModule

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

export interface IDeclarationInfo {
  name: string
  is_array: boolean
  dimensions: number[] 
}

export interface IInvocationInfo {
  name: string
  is_array: boolean
  indexes: IExpElement[][]
}

/**
 * Representa un elemento de una expresion
 */
export interface IExpElement {
  type: 'invocation' | 'literal' | 'operator' | 'parenthesis' | 'call'
  name?: string
}

export interface ILiteralValue {
  type: 'literal'
  value: boolean | string | number
}

export interface IInvocationValue {
  type: 'invocation'
  name: string
  is_array: boolean
  indexes: IExpElement[][]
}

export interface IParameter {
  name: string
  by_ref: boolean
  type: TypeNameString
}

export interface IModuleCall {
  type: 'call'
  args: IExpElement[][]
  name: string
}

export interface IAssignment {
  type: 'assignment'
  left: IInvocationInfo
  right: IExpElement[]
}

export interface IIf {
  type: 'if'
  condition: IExpElement[]
  true_branch: Statement[]
  false_branch: Statement[]
}

export interface IWhile {
  type: 'while'
  condition: IExpElement[]
  body: Statement[]
}

export interface IFor {
  type: 'for'
  counter_init: IAssignment
  last_value: IExpElement[]
  body: Statement[]
}

export interface IUntil {
  type: 'until'
  condition: IExpElement[]
  body: Statement[]
}

export interface IReturn {
  type: 'return'
  expression: IExpElement[]
}

export interface ITypedDeclaration extends IDeclarationInfo {
  datatype: string
}

export interface IDeclarationStatement {
  type: 'declaration'
  variables: ITypedDeclaration[]
}

export interface IMainModule {
  type: 'module'
  name: 'main'
  module_type: 'main'
  body: Statement[]
}

export interface IFunctionModule {
  type: 'module'
  module_type: 'function'
  name: string
  parameters: IParameter[]
  body: Statement[]
  return_type: string
}

export interface IProcedureModule {
  type: 'module'
  module_type: 'procedure'
  name: string
  parameters: IParameter[]
  body: Statement[]
}