import * as S1 from './Stage1'
import * as PI from './ParsingInterfaces'

export interface UndefinedModule {
    name: string,
    reason: '@call-undefined-module'
}

export interface AST {
  modules: {
    main: Main
    [m: string]: Module
  }
  local_variables: {
    [m: string]: S1.VariableDict
  }
}

export type Call = IOCall | ModuleCall

export interface ModuleCall {

} 

export interface Assignment {

}

export interface If {

}

export interface While {

}

export interface For {

}

export interface Until {
  
}

export interface Module {

}

export type Statement = Call | Assignment | If | While | For | Until

export interface IOCall extends PI.IModuleCall {
  name: 'escribir' | 'leer'
}

export interface TransformedModule {
    
}

export interface Main {
    
}