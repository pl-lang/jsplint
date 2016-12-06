import * as S1 from './Stage1'
import * as PI from './ParsingInterfaces'

export interface UndefinedModule {
    name: string
    reason: '@call-undefined-module'
}

export interface UndefinedVariable {
  name: string
  reason: 'undefined-variable'
}

export type Error = UndefinedModule | UndefinedVariable

export interface AST {
  modules: {
    main: Main
    user_modules: {
      [m: string]: Module
    }
  }
  local_variables: {
    main: S1.VariableDict
    [m: string]: S1.VariableDict
  }
}

// estas propiedades extra deben ser iguales a las de PI.UserModule 
export interface ModuleCall extends PI.Call {
  module_type: 'function' | 'procedure'
  parameters: PI.Parameter[]
  return_type: 'entero' | 'real' | 'caracter' | 'logico' | 'ninguno' 
}

export interface Assignment {
  type: 'assignment'
  left: InvocationInfo
  right: PI.ExpElement[]
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
  counter_init: Assignment
}

export interface Until extends PI.Until {
  body: Statement[]
}

export type Statement = ReadCall | WriteCall | ModuleCall | Assignment | If | While | For | Until | PI.Return 

export interface ReadCall extends PI.Call {
  name: 'leer'
}

export interface WriteCall extends PI.Call {
  name: 'escribir'
}

export interface TransformedModule {
    
}

// Esto cambia los enunciados que el modulo contiene por los enunciados S2 (todos menos los de declaracion)
// Debe mantenerse sincronizado con los analogos de Stage1
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

export interface VarDimensions {
  dimensions: number[]
}

export interface InvocationInfo extends PI.InvocationInfo {
  dimensions: number[]
}

export interface InvocationValue extends PI.InvocationValue {
  dimensions: number[]
}