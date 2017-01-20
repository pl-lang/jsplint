/**
 * Interfaces que representan el retorno de una funcion que puede fallar
 */
export interface Failure<A> {
  error: true,
  result: A
}

export interface Success<A> {
  error: false,
  result: A
}

/**
 * Interfaz para errores lexicos
 */
export interface LexicalError {
    unexpected : string
    expected : string[],
    reason : string,
    column : number
    line : number
}

/**
 * Interfaces para elementos sintacticos
 */
export enum ValueKind {
  Integer = 0,
  Real,
  String
}

export enum SymbolKind {
  Plus = ValueKind.String + 1,
  Minus,
  Times,
  Slash,
  Power,
  Assignment,
  Minor,
  MinorEq,
  Different,
  Equal,
  Major,
  MajorEq,
  LeftPar,
  RightPar,
  LeftBracket,
  RightBracket,
  Comma,
  EOF,
  EOL
}

export enum ReservedKind {
  Si = SymbolKind.EOL + 1,
  Or,
  Fin,
  Que,
  Div,
  And,
  Not,
  Mod,
  Ref,
  Sino,
  Para,
  Real,
  FinSi,
  Hasta,
  Falso,
  Inicio,
  Entero,
  Logico,
  FinPara,
  Repetir,
  Funcion,
  Entonces,
  Mientras,
  Caracter,
  Retornar,
  Variables,
  Verdadero,
  FinFuncion,
  FinMientras,
  Procedimiento,
  FinProcedimiento
}

export enum OtherKind {
  Word = ReservedKind.FinProcedimiento + 1,
  Unknown
}

/**
 * Interfaz de un token generico
 */
export interface Token {
  kind: ValueKind | SymbolKind | OtherKind | ReservedKind 
  column: number
  line: number
  error_found: boolean
  error_info: LexicalError
  name: string
  value?: number | string
  text?: string
}

  export type TokenKind = ValueKind | ReservedKind | SymbolKind | OtherKind

/**
 * ====================================================
 * PARSING INTERFACES
 * ====================================================
 */

/**
 * Represents an error produced while trying to match a syntactic pattern
 */
export interface PatternError {
  unexpected: ValueKind | ReservedKind | SymbolKind | OtherKind,
  expected: string[],
  column: number,
  line: number,
  reason?: string
}

export type DataTypeKind = ReservedKind.Entero | ReservedKind.Real | ReservedKind.Logico | ReservedKind.Caracter

export type TypeNameString = 'entero' | 'real' | 'logico' | 'caracter'

/**
 * Stage0 (not yet transformed) statements and expressions
 */
export namespace S0 {
  export interface NumberInfo {
    value: number,
    type: ValueKind.Integer | ValueKind.Real
  }

  export type Statement = Call | Assignment | If | While | For | Until | Return | Declaration

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

  export type ExpValue = LiteralValue  | InvocationValue | Call

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

  export interface OperatorElement extends ExpElement {
    type: 'operator'
    name: 'plus' | 'minus' | 'slash' | 'times' | 'power' | 'minor-eq' | 'different' | 'minor' | 'major-eq' | 'major' | 'equal' | 'and' | 'or' | 'not' | 'div' | 'mod'
  }

  export interface Parameter {
    name: string
    by_ref: boolean
    type: TypeNameString
    is_array: boolean
    dimensions: number[]
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
    parameters: Parameter[]
    return_type: 'entero' | 'real' | 'caracter' | 'logico'
  }

  export interface Procedure {
    type: 'module'
    name: string
    module_type: 'procedure'
    body: Statement[]
    parameters: Parameter[]
    return_type: 'ninguno'
  }
}

export interface ParsedProgram {
  main: S0.Main,
  user_modules: {
    [m: string]: S0.Module
  }
}

/**
 * ====================================================
 * TRANSFORMS' INTERFACES
 * ====================================================
 */

/**
 * Stage 1: given a program it returns the same program minus all the variable
 * declaration statements plus the program's variables (declared in a separate object).
 */

export namespace S1 {

  /**
   * Interface of this stage's final result
   */
  export interface AST {
    modules: {
      main: Main
      user_modules: {
        [m: string]: Function | Procedure
      }
    }
    local_variables: {
      main: VariableDict
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
    parameters: S0.Parameter[]
    return_type: 'entero' | 'real' | 'caracter' | 'logico'
  }

  export interface Procedure {
    type: 'module'
    name: string
    module_type: 'procedure'
    body: Statement[]
    parameters: S0.Parameter[]
    return_type: 'ninguno'
  }

  export type Statement = S0.Call | Assignment | If | While | For | Until | S0.Return

  export interface Assignment extends S0.Assignment {
    body: Statement[]
  }

  export interface If extends S0.If {
    true_branch: Statement[]
    false_branch: Statement[]
  }

  export interface While extends S0.While {
    body: Statement[]
  }

  export interface For extends S0.For {
    body: Statement[]
  }

  export interface Until extends S0.Until {
    body: Statement[]
  }

  export interface ArrayVariable extends S0.TypedDeclaration {
    is_array: true
    values: any[]
  }

  export interface VariableDict {
    [v:string]: Variable
  }

  export type Variable = ArrayVariable | RegularVariable

  export interface RegularVariable extends S0.TypedDeclaration {
    is_array: false
    value: any
  }

  export interface RepeatedVarError {
    reason: 'repeated-variable'
    name: string
    first_type: string
    second_type: string
  }
}