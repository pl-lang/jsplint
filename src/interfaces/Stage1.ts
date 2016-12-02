import * as PI from './ParsingInterfaces'

// Stage 1: Declarator

export interface AST {
  modules: {
    main: Main
    user_modules: {
      [m: string]: Function | Procedure
    }
  }
  local_variables: {
    [m: string]: VariableDict
  }
}

export interface TransformedModule {
  new_module: Module
  locals: VariableDict
}

export interface TransformedMain {
  new_module: Main
  locals: VariableDict
}

// Esto cambia los enunciados que el modulo contiene por los enunciados S1 (todos menos los de declaracion)
// Debe mantenerse sincronizado con los analogos de ParsingInterfaces
export type Module = Function | Procedure 

export interface Main {
  type: 'module'
  name: 'main'
  module_type: 'main'
  body: Statement[]
}

export interface Function {
  type: 'module'
  name: string
  module_type: 'function'
  body: Statement[]
  parameters: PI.Parameter[]
  return_type: 'entero' | 'real' | 'caracter' | 'logico'
}

export interface Procedure {
  type: 'module'
  name: string
  module_type: 'procedure'
  body: Statement[]
  parameters: PI.Parameter[]
  return_type: 'ninguno'
}

export type Statement = PI.Call | Assignment | If | While | For | Until | PI.Return

export interface Assignment extends PI.Assignment {
  body: Statement[]
}

export interface If extends PI.If {
  true_branch: Statement[]
  false_branch: Statement[]
}

export interface While extends PI.While {
  body: Statement[]
}

export interface For extends PI.For {
  body: Statement[]
}

export interface Until extends PI.Until {
  body: Statement[]
}

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