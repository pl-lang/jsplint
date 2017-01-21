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

/**
 * Stage 2: decorates module (calls with return type 
 * and parameter info) and variable invocations (with
 * their respective variables' dimension).
 */

export namespace S2 {
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
  export interface ModuleCall extends S0.Call {
    args: ExpElement[][]
    module_type: 'function' | 'procedure'
    parameters: S0.Parameter[]
    return_type: 'entero' | 'real' | 'caracter' | 'logico' | 'ninguno' 
  }

  export interface Assignment {
    type: 'assignment'
    left: InvocationInfo
    right: ExpElement[]
  }

  export type ExpValue = InvocationValue | ModuleCall | S0.LiteralValue
  
  export type ExpElement = ExpValue | S0.OperatorElement

  export interface If extends S0.If {
    condition: ExpElement[]
    true_branch: Statement[]
    false_branch: Statement[]
  }

  export interface While extends S0.While {
    condition: ExpElement[]
    body: Statement[]
  }

  export interface For extends S0.For {
    last_value: ExpElement[]
    body: Statement[]
    counter_init: Assignment
  }

  export interface Until extends S0.Until {
    condition: ExpElement[]
    body: Statement[]
  }

  export type Statement = ReadCall | WriteCall | ModuleCall | Assignment | If | While | For | Until | S0.Return 

  export interface ReadCall extends S0.Call {
    args: ExpElement[][]
    name: 'leer'
  }

  export interface WriteCall extends S0.Call {
    args: ExpElement[][]
    name: 'escribir'
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

  export interface VarInfo {
    dimensions: number[]
    is_array: boolean
  }

  export interface InvocationInfo extends S0.InvocationInfo {
    dimensions: number[]
  }

  export interface InvocationValue extends S0.InvocationValue {
    dimensions: number[]
  }
}

/**
 * Stage 3: transforms a program into another that's equivalent
 * and can be executed by the interpreter
 */

export namespace S3 {
  export interface Program {
      entry_point: Statement
      modules: {
          [p:string] : Module
      }
      local_variables: {
          main: S1.VariableDict
          [p:string] : S1.VariableDict
      }
  }

  export interface Module {
      name: string
      entry_point: Statement
      parameters: {
          [p: string]: Parameter
      }
  }

  export interface Parameter {
      name: string
      by_ref: boolean
      is_array: boolean
  }

  export function get_last (s: Statement) : Statement {
    let current = s
    while (current.exit_point !== null) {
        current = current.exit_point
    }
    return current
  }

  export enum StatementKinds {
    Plus = 0,
    Minus,
    Times,
    Slash,
    Div,
    Mod,
    Power,
    Assign,
    Get,
    AssignV,
    GetV,
    Push,
    Pop,
    Minor,
    MinorEq,
    Different,
    Equal,
    Major,
    MajorEq,
    Not,
    And,
    Or,
    If,
    While,
    Until,
    UserModuleCall,
    ReadCall,
    WriteCall,
    Return
  }

  export class BaseStatement {
      readonly kind: StatementKinds
      protected _exit_point: Statement
      protected exit_set: boolean

      constructor () {
          this._exit_point = null
          this.exit_set = false
      }

      set exit_point (s: Statement) {
          if (this.exit_set == true) {
              throw new Error('No se puede establecer el punto de salida de un Statement mas de una vez.')
          }
          else {
              this._exit_point = s
              this.exit_set = true
          }
      }

      get exit_point () : Statement {
          return this._exit_point
      }
  }

  export class Return extends BaseStatement {
    readonly kind: StatementKinds.Return

    constructor() {
        super()
        this.kind = StatementKinds.Return
    }
  }

  export class UserModuleCall extends BaseStatement {
      readonly kind: StatementKinds.UserModuleCall

      constructor (readonly name: string, readonly total_args: number) {
          super()
          this.kind = StatementKinds.UserModuleCall
      }
  }

  export class ReadCall extends BaseStatement {
      readonly name: 'leer'
      readonly kind: StatementKinds.ReadCall

      constructor (readonly varname: string) {
          super()
          this.kind = StatementKinds.ReadCall
          this.name = 'leer'
      }
  }

  export class WriteCall extends BaseStatement {
      readonly name: 'escribir'
      readonly kind: StatementKinds.WriteCall

      constructor () {
          super()
          this.kind = StatementKinds.WriteCall
          this.name = 'escribir'
      }
  }

  export class Assign extends BaseStatement {
      readonly kind: StatementKinds.Assign

      constructor (readonly varname: string) {
          super()
          this.kind = StatementKinds.Assign
      }
  }

  export class AssignV extends BaseStatement {
      readonly kind: StatementKinds.AssignV

      constructor (readonly total_indexes: number, readonly dimensions: number[], readonly varname: string) {
          super()
          this.kind = StatementKinds.AssignV
      }
  }

  export class Get extends BaseStatement {
      readonly kind: StatementKinds.Get
      
      constructor (readonly varname: string) {
          super()
          this.kind = StatementKinds.Get
      }
  }

  export class GetV extends BaseStatement {
      readonly kind: StatementKinds.GetV
      
      constructor (readonly total_indexes: number, readonly dimensions: number[], readonly varname: string) {
          super()
          this.kind = StatementKinds.GetV
      }
  }

  export class Push extends BaseStatement {
      readonly kind: StatementKinds.Push
      
      constructor (readonly value: number | boolean | string) {
          super()
          this.kind = StatementKinds.Push
      }
  }

  export class Pop extends BaseStatement {
      readonly kind: StatementKinds.Pop
      
      constructor () {
          super()
          this.kind = StatementKinds.Pop
      }
  }

  export class Operation extends BaseStatement {
      
      constructor (readonly kind: OperationKinds) {
          super()
      }
  }

  export class While extends BaseStatement {
      readonly kind: StatementKinds.While

      constructor (readonly entry_point: Statement) {
          super()
          this.kind = StatementKinds.While
      }
  }

  export class Until extends BaseStatement {
      readonly kind: StatementKinds.Until

      constructor (readonly entry_point: Statement) {
          super()
          this.kind = StatementKinds.Until
      }
  }

  export class If extends BaseStatement {
      readonly kind: StatementKinds.If
      
      constructor (readonly true_branch_entry: Statement, readonly false_branch_entry: Statement) {
          super()
          this.kind = StatementKinds.If
      }

      set exit_point (s: Statement) {
          if (this.exit_set == true) {
              throw new Error('No se puede establecer el punto de salida de un Statement mas de una vez.')
          }
          else {
              this._exit_point = s

              const last_true_s = get_last(this.true_branch_entry)
              last_true_s.exit_point = s

              const last_false_s = get_last(this.false_branch_entry)
              last_false_s.exit_point = s

              this.exit_set = true
          }
      }

      get exit_point () : Statement {
          return this._exit_point
      }    
  }

  export type OperationKinds = MathOps | ComparisonOps | LogicOps

  export type MathOps = StatementKinds.Plus  | StatementKinds.Minus | StatementKinds.Times | StatementKinds.Slash | StatementKinds.Power | StatementKinds.Div | StatementKinds.Mod

  export type ComparisonOps = StatementKinds.Minor | StatementKinds.MinorEq | StatementKinds.Different | StatementKinds.Equal | StatementKinds.Major | StatementKinds.MajorEq

  export type LogicOps = StatementKinds.And | StatementKinds.Or | StatementKinds.Not

  export type Statement = While | If | Until | UserModuleCall | ReadCall | WriteCall | Assign | Get | Operation | AssignV | GetV | Push | Pop | Return

}