import * as PI from './ParsingInterfaces'

// Stage 1: Declarator

export interface AST {
  modules: {
    main: Main
    [m: string]: Module
  }
  local_variables: {
    [m: string]: VariableDict
  }
}

export interface TransformedModule {
  new_module: Module
  locals: VariableDict
}

export type Module = Main | Function | Procedure

export interface Main {
  type: 'module'
  module_type: 'main'
  name: 'main'
  body: Statement[]
}

export interface Function {
  type: 'module'
  module_type: 'function'
  name: string
  parameters: PI.Parameter[]
  body: Statement[]
  return_type: string
}

export interface Procedure {
  type: 'module'
  module_type: 'procedure'
  name: string
  parameters: PI.Parameter[]
  body: Statement[]
}

export type Statement = PI.Call | PI.Assignment | PI.If | PI.While | PI.For | PI.Until

export interface ArrayVariable extends PI.TypedDeclaration {
  is_array: true
  values: any[]
}

export interface VariableDict {
  [v:string]: Variable
}

export type Variable = ArrayVariable | RegularVariable

export interface RegularVariable extends PI.TypedDeclaration {
  is_array: false
  value: any
}

export interface RepeatedVarError {
  reason: string
  name: string
  first_type: string
  second_type: string
}