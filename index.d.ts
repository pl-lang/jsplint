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

export namespace Errors {
  export type TypeError = IncompatibleArgument
    | IncompatibleOperand
    | IncompatibleOperands
    | IncompatibleTypes
    | BadIOArgument
    | MissingOperands
    | BadCondition
    | BadCounter
    | BadInitValue
    | BadLastValue
    | BadReturn
    | BadComparisonOperands;

  export interface Base {
    reason: string
    where: string
    pos?: {
      column: number
      line: number
    }
  }

  export interface BadComparisonOperands extends Base {
    reason: '@comparison-bad-operands'
    where: 'typechecker'
    left: string
    right: string
  }

  export interface Lexical extends Base {
    unexpected: string
    expected: string[]
  }

  export interface UndefinedModule extends Base {
    name: string
    reason: '@call-undefined-module'
    where: 'call-decorator-transform'
  }

  export interface UndefinedVariable extends Base {
    name: string
    reason: 'undefined-variable'
    where: 'call-decorator-transform'
  }

  export interface Pattern extends Base {
    unexpected: ValueKind | ReservedKind | SymbolKind | OtherKind
    expected: string[],
    reason: string
    where: 'parser'
  }

  export interface RepeatedVar {
    reason: 'repeated-variable'
    name: string
    first_type: string
    second_type: string
    where: 'declarator-transform'
  }

  export interface ExtraIndexes {
    reason: '@invocation-extra-indexes'
    name: string
    dimensions: number
    indexes: number
    where: 'typer'
  }

  export interface MissingOperands extends Base {
    reason: 'missing-operands'
    where: 'typechecker'
    operator: string
    required: number
  }

  export interface IncompatibleOperand extends Base {
    reason: 'incompatible-operand'
    where: 'typechecker'
    operator: string
    bad_type: string
  }

  export interface IncompatibleOperands extends Base {
    reason: 'incompatible-operands'
    where: 'typechecker'
    operator: string
    bad_type_a: string
    bad_type_b: string
  }

  export interface IncompatibleTypes extends Base {
    reason: '@assignment-incompatible-types'
    where: 'typechecker'
    expected: string
    received: string
  }

  export interface IncompatibleArgument extends Base {
    reason: '@call-incompatible-argument'
    where: 'typechecker'
    expected: string
    received: string
    index: number
  }

  export interface BadIOArgument extends Base {
    reason: 'bad-io-argument'
    where: 'typechecker'
    received: string
    index: number
  }

  export interface OutOfBounds extends Base {
    reason: 'index-out-of-bounds'
    where: 'evaluator'
    name: string
    bad_index: number
    dimensions: number[]

    /**
     * Propiedad especifica de los retornos del evaluador
     */
    done: boolean
  }

  export interface BadCondition extends Base {
    reason: 'bad-condition'
    where: 'typechecker'
    received: string
  }

  export interface BadCounter extends Base {
    reason: '@for-bad-counter'
    where: 'typechecker'
    received: string
  }

  export interface BadInitValue extends Base {
    reason: '@for-bad-init'
    where: 'typechecker'
    received: string
  }

  export interface BadLastValue extends Base {
    reason: '@for-bad-last'
    where: 'typechecker'
    received: string
  }

  export interface BadReturn extends Base {
    reason: 'bad-return'
    where: 'typechecker'
    declared: string
    received: string
  }
}

/**
 * Interfaces para elementos sintacticos
 */
export enum ValueKind {
  Integer = 0,
  Real = 1,
  String = 2,
}

export enum SymbolKind {
  Plus = 3,
  Minus = 4,
  Times = 5,
  Slash = 6,
  Power = 7,
  Assignment = 8,
  Minor = 9,
  MinorEq = 10,
  Different = 11,
  Equal = 12,
  Major = 13,
  MajorEq = 14,
  LeftPar = 15,
  RightPar = 16,
  LeftBracket = 17,
  RightBracket = 18,
  Comma = 19,
  EOF = 20,
  EOL = 21,
}

export enum ReservedKind {
  Si = 22,
  Or = 23,
  Fin = 24,
  Que = 25,
  Div = 26,
  And = 27,
  Not = 28,
  Mod = 29,
  Ref = 30,
  Sino = 31,
  Para = 32,
  Real = 33,
  FinSi = 34,
  Hasta = 35,
  Falso = 36,
  Inicio = 37,
  Entero = 38,
  Logico = 39,
  FinPara = 40,
  Repetir = 41,
  Funcion = 42,
  Entonces = 43,
  Mientras = 44,
  Caracter = 45,
  Retornar = 46,
  Variables = 47,
  Verdadero = 48,
  FinFuncion = 49,
  FinMientras = 50,
  Procedimiento = 51,
  FinProcedimiento = 52,
}
export enum OtherKind {
  Word = 53,
  Unknown = 54,
}

/**
 * Interfaz de un token generico
 */
export interface Token {
  kind: ValueKind | SymbolKind | OtherKind | ReservedKind
  column: number
  line: number
  error_found: boolean
  error_info: Errors.Lexical
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

export type DataTypeKind = ReservedKind.Entero | ReservedKind.Real | ReservedKind.Logico | ReservedKind.Caracter

export type TypeNameString = 'entero' | 'real' | 'logico' | 'caracter' | 'ninguno'

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

  /**
   * InvocationInfo se usa del lado izquierdo de
   * una asignacion, es decir, contiene informacion
   * sobre la variable a la que se va a asignar algo.
   */
  export interface InvocationInfo {
    name: string
    is_array: boolean
    indexes: ExpElement[][]
  }

  export type ExpValue = LiteralValue | InvocationValue | Call

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
    datatype: TypeNameString
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
    [v: string]: Variable
  }

  export type Variable = ArrayVariable | RegularVariable

  export interface RegularVariable extends S0.TypedDeclaration {
    is_array: false
    value: any
  }
}

/**
 * Stage 2: decorates module (calls with return type 
 * and parameter info) and variable invocations (with
 * their respective variables' dimension).
 */

export namespace S2 {

  export type Error = Errors.UndefinedModule | Errors.UndefinedVariable

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
    return_type: TypeNameString
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

  export type Statement = ModuleCall | Assignment | If | While | For | Until | S0.Return

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
    datatype: TypeNameString
    dimensions: number[]
    is_array: boolean
  }

  export interface InvocationInfo extends S0.InvocationInfo {
    datatype: TypeNameString
    dimensions: number[]
    indexes: ExpElement[][]
  }

  export interface InvocationValue extends S0.InvocationValue {
    dimensions: number[]
    datatype: TypeNameString
    indexes: ExpElement[][]
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
      [p: string]: Module
    }
    local_variables: {
      main: S1.VariableDict
      [p: string]: S1.VariableDict
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

  export function get_last(s: Statement): Statement;

  export enum StatementKinds {
    Plus = 0,
    Minus = 1,
    Times = 2,
    Slash = 3,
    Div = 4,
    Mod = 5,
    Power = 6,
    Assign = 7,
    Get = 8,
    AssignV = 9,
    GetV = 10,
    Push = 11,
    Pop = 12,
    Minor = 13,
    MinorEq = 14,
    Different = 15,
    Equal = 16,
    Major = 17,
    MajorEq = 18,
    Not = 19,
    And = 20,
    Or = 21,
    If = 22,
    While = 23,
    Until = 24,
    UserModuleCall = 25,
    ReadCall = 26,
    WriteCall = 27,
    Return = 28,
  }

  export class BaseStatement {
    readonly kind: StatementKinds
    protected _exit_point: Statement
    protected exit_set: boolean
    exit_point: Statement

    constructor()
  }

  class Return extends BaseStatement {
    readonly kind: StatementKinds.Return

    constructor()
  }

  class UserModuleCall extends BaseStatement {
    readonly kind: StatementKinds.UserModuleCall
    readonly name: string
    readonly total_args: number

    constructor(name: string, total_args: number)
  }

  class ReadCall extends BaseStatement {
    readonly name: 'leer'
    readonly kind: StatementKinds.ReadCall
    readonly varname: string

    constructor(varname: string)
  }

  class WriteCall extends BaseStatement {
    readonly name: 'escribir'
    readonly kind: StatementKinds.WriteCall

    constructor()
  }

  class Assign extends BaseStatement {
    readonly kind: StatementKinds.Assign
    readonly varname: string

    constructor(varname: string)
  }

  class AssignV extends BaseStatement {
    readonly kind: StatementKinds.AssignV
    readonly total_indexes: number
    readonly dimensions: number[]
    readonly varname: string

    constructor(total_indexes: number, dimensions: number[], varname: string)
  }

  class Get extends BaseStatement {
    readonly kind: StatementKinds.Get
    readonly varname: string

    constructor(varname: string)
  }

  class GetV extends BaseStatement {
    readonly kind: StatementKinds.GetV
    readonly total_indexes: number
    readonly dimensions: number[]
    readonly varname: string

    constructor(total_indexes: number, dimensions: number, varname: string)
  }

  class Push extends BaseStatement {
    readonly kind: StatementKinds.Push
    readonly value: number | boolean | string

    constructor(value: number | boolean | string)
  }

  class Pop extends BaseStatement {
    readonly kind: StatementKinds.Pop

    constructor()
  }

  class Operation extends BaseStatement {
    readonly kind: OperationKinds

    constructor(kind: OperationKinds)
  }

  class While extends BaseStatement {
    readonly kind: StatementKinds.While
    readonly entry_point: Statement

    constructor(entry_point: Statement)
  }

  class Until extends BaseStatement {
    readonly kind: StatementKinds.Until
    readonly entry_point: Statement

    constructor(entry_point: Statement)
  }

  class If extends BaseStatement {
    readonly kind: StatementKinds.If
    readonly true_branch_entry: Statement
    readonly false_branch_entry: Statement
    exit_point: Statement

    constructor(true_branch_entry: Statement, false_branch_entry: Statement)
  }

  export type OperationKinds = MathOps | ComparisonOps | LogicOps

  export type MathOps = StatementKinds.Plus | StatementKinds.Minus | StatementKinds.Times | StatementKinds.Slash | StatementKinds.Power | StatementKinds.Div | StatementKinds.Mod

  export type ComparisonOps = StatementKinds.Minor | StatementKinds.MinorEq | StatementKinds.Different | StatementKinds.Equal | StatementKinds.Major | StatementKinds.MajorEq

  export type LogicOps = StatementKinds.And | StatementKinds.Or | StatementKinds.Not

  export type Statement = While | If | Until | UserModuleCall | ReadCall | WriteCall | Assign | Get | Operation | AssignV | GetV | Push | Pop | Return

}

/**
 * Stage 4:
 */

export namespace Typed {
  export interface Program {
    [m: string]: Module
  }

  export interface Module {
    module_type: 'function' | 'procedure' | 'main'
    body: Statement[]
    return_type: 'entero' | 'real' | 'caracter' | 'logico' | 'ninguno'
    parameters: S0.Parameter[]
  }

  export type Statement = For
    | While
    | Until
    | If
    | Assignment
    | Call
    | Return;
  // | ReadCall
  // | WriteCall;
  export interface Return {
    type: 'return'
    actual: ExpElement[]
    expected: Type
  }

  export interface For {
    type: 'for'
    counter_init: Assignment
    last_value: ExpElement[]
    body: Statement[]
  }

  export interface While {
    type: 'while'
    condition: ExpElement[]
    body: Statement[]
  }

  export interface Until {
    type: 'until'
    condition: ExpElement[]
    body: Statement[]
  }

  export interface If {
    type: 'if'
    condition: ExpElement[]
    true_branch: Statement[]
    false_branch: Statement[]
  }

  export interface Assignment {
    type: 'assignment'
    left: Invocation
    right: ExpElement[]
  }

  export interface Invocation {
    type: 'invocation'
    datatype: Type
    indextypes: ExpElement[][]
  }

  export interface Call {
    type: 'call'
    datatype: AtomicType // tipo de dato del valor que esta llamada retorna
    argtypes: ExpElement[][] // tipos de los argumentos usados en la llamada
    paramtypes: Type[] // tipos de los parametros declarados para este modulo
    name: string
  }

  export type ExpElement = Type | Invocation | Call | Operator

  export interface Type {
    type: 'type'
    kind: 'atomic' | 'array'
  }

  export interface Operator {
    type: 'operator'
    name: string
  }

  export class ArrayType implements Type {
    type: 'type'
    kind: 'array'
    length: number
    cell_type: Type

    constructor(element_type: Type, length: number)
  }

  export class AtomicType implements Type {
    type: 'type'
    kind: 'atomic'
    typename: TypeNameString

    constructor(tn: TypeNameString)
  }

  export class StringType extends ArrayType {
    constructor(length: number)
  }
}

export type TransformError = Failure<Errors.RepeatedVar[]> | Failure<S2.Error[]> | Failure<Errors.ExtraIndexes[]>

export interface TransformedProgram {
  typed_program: Typed.Program,
  program: S3.Program
}

/**
 * Value
 * representa un valor resultante de una expresion
 */
export type Value = boolean | number | string

export interface Read {
  action: 'read'
  // agregar esto mas adelante
  // type: 'entero' | 'real' | 'caracter' | 'cadena'
  done: boolean
}

export interface Write {
  action: 'write',
  value: Value
  done: boolean
}

export interface NullAction {
  action: 'none'
  done: boolean
}

export interface Paused {
  action: 'paused'
  done: boolean
}

export type SuccessfulReturn = Success<Read> | Success<Write> | Success<NullAction>

type ICallback = (...params: any[]) => void;

export class Emitter {
  public_events: string[];
  private callbacks;
  constructor(public_event_list: string[]);
  on(event_name: string, callback: ICallback): void;
  /**
   * Se encarga de llamar a los callbacks de los eventos.
   * Si se registro un callback para 'any' entonces se lo llama para cada evento que sea emitido. Es el callback por defecto.
   * Si un evento tiene registrado un callback entonces este se ejecuta despues del callback por defecto.
   */
  emit(event_name: string, ...args: any[]): void;
  /**
   * Repite un evento de otro emisor como si fuera propio. El evento puede registrar como publico o no.
   */
  repeat(event_name: string, emitter: Emitter, make_public: boolean, ...args: any[]): void;
  /**
   * Emitir los eventos de otro emisor como si fueran propios.
   */
  repeatAllPublicEvents(emitter: Emitter): void;
}

export interface Read {
  action: 'read'
  // agregar esto mas adelante
  // type: 'entero' | 'real' | 'caracter' | 'cadena'
  done: boolean
}

export interface Write {
  action: 'write',
  value: Value
  done: boolean
}

export interface NullAction {
  action: 'none'
  done: boolean
}

export interface Paused {
  action: 'paused'
  done: boolean
}

export class Parser extends Emitter {
  constructor();
  parse(code: string): Failure<Errors.Lexical[] | Errors.Pattern[]> | Success<ParsedProgram>;
}

export class Interpreter extends Emitter {
  private evaluator;
  running: boolean;
  paused: boolean;
  data_read: boolean;
  constructor(p: S3.Program);
  run(): void;
  send(value: Value): void;
}

export function transform(p: ParsedProgram): TransformError | Success<TransformedProgram>

export function typecheck(p: Typed.Program): Errors.TypeError[]