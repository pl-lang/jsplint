import {IModuleCall , IAssignment , IIf , IWhile , IFor , IUntil, IReturn, IProcedureModule, IFunctionModule} from './ParsingInterfaces'

import {ParsedProgram, Module, IMainModule, IDeclarationStatement, ITypedDeclaration, IParameter} from './ParsingInterfaces'

// Stage 1: Declarator

namespace Stage1 {
  
}

export interface Stage1AST {
  modules: {
    main: S1Main
    [m: string]: S1Module
  }
  local_variables: {
    [m: string]: VariableDict
  }
}

export interface S1TransformedModule {
  new_module: S1Module
  locals: VariableDict
}

export type S1Module = S1Main | S1Function | S1Procedure

export interface S1Main {
  type: 'module'
  module_type: 'main'
  name: 'main'
  body: S1Statement[]
}

export interface S1Function {
  type: 'module'
  module_type: 'function'
  name: string
  parameters: IParameter[]
  body: S1Statement[]
  return_type: string
}

export interface S1Procedure {
  type: 'module'
  module_type: 'procedure'
  name: string
  parameters: IParameter[]
  body: S1Statement[]
}

export type S1Statement = IModuleCall | IAssignment | IIf | IWhile | IFor | IUntil

export interface ArrayVariable extends ITypedDeclaration {
  is_array: true
  values: any[]
}

export interface VariableDict {
  [v:string]: Variable
}

export type Variable = ArrayVariable | RegularVariable

export interface RegularVariable extends ITypedDeclaration {
  is_array: false
  value: any
}

export interface RepeatedVarError {
  reason: string
  name: string
  first_type: string
  second_type: string
}