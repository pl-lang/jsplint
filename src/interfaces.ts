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
  | IncompatibleTypes
  | BadWriteArg
  | BadCondition
  | BadCounter
  | BadInitValue
  | BadLastValue
  | BadReturn
  | WrongArgAmount
  | BadIndex
  | LongString
  | BadRefArg
  | BadReadArg;

  export interface Base {
    reason: string
    where: string
    pos?: {
      column: number
      line: number
    }
  }

  /**
   * Emitido cuando se pasa un literal a 'leer'
   */
  export interface BadReadArg extends Base {
    reason: '@read-bad-arg'
    where: 'typechecker'
    /**
     * Indice del argumento literal que de esta llamada
     */
    index: number
  }

  /**
   * Emitido cuando se llama un modulo con un literal como
   * parametro por referencia
   */
  export interface BadRefArg extends Base {
    reason: '@call-bad-ref-arg'
    where: 'typechecker'
    /**
     * Tipo del parametro en cuestion
     */
    param_expected: string
    /**
     * Nombre del parametro en cuestion
     */
    param_name: string
    /**
     * Nombre del modulo al que pertenece
     */
    module: string
    /**
     * Tipo del valor literal recibido como argumento
     */
    received: string
    /**
     * Indice (en la lista de parametros del modulo)
     */
    index: number
  }

  export interface LongString extends Base {
    reason: '@assignment-long-string' | '@read-long-string'
    where: 'typechecker' | 'interpreter'
    name: string
    type: string
    vector_length: number
    string_length: number
  }

  export interface BadIndex extends Base {
    reason: '@invocation-bad-index'
    where: 'typechecker'
    received: string
    name: string
    at: number
  }

  export interface WrongArgAmount extends Base {
    reason: '@call-wrong-arg-amount'
    where: 'typechecker'
    expected: number
    received: number
    name: string
  }

  export interface BadComparisonOperands extends Base {
    reason: '@comparison-bad-operands'
    where: 'typer'
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
    where: 'typer'
    operator: string
    required: number
  }

  export interface IncompatibleOperand extends Base {
    reason: 'incompatible-operand'
    where: 'typer'
    operator: string
    bad_type: string
  }

  export interface IncompatibleOperands extends Base {
    reason: 'incompatible-operands'
    where: 'typer'
    operator: string
    bad_type_a: string
    bad_type_b: string
  }

  export interface IncompatibleTypes extends Base {
    reason: '@assignment-incompatible-types' | '@read-incompatible-types'
    where: 'typechecker' | 'interpreter'
    expected: string
    received: string
  }

  export interface IncompatibleArgument extends Base {
    reason: '@call-incompatible-argument'
    name: string
    where: 'typechecker'
    expected: string
    received: string
    index: number
  }

  export interface BadWriteArg extends Base {
    reason: 'bad-write-arg'
    where: 'typechecker'
    received: string
    index: number
    name: string
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
  Real,
  String
}

export enum SymbolKind {
  Plus = 3,
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
  Si = 22,
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
  Word = 53,
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

  export interface Return {
    type: 'return'
    expression: ExpElement[]
    expected: TypeNameString
  }

  export type Statement = ModuleCall | Assignment | If | While | For | Until | Return

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

  export function get_last(s: Statement): Statement {
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
    Return,
    Concat,
    AssignString,
    Alias
  }

  export class BaseStatement {
    readonly kind: StatementKinds
    protected _exit_point: Statement
    protected exit_set: boolean
    readonly owner: string

    constructor(owner: string) {
      this.owner = owner
      this._exit_point = null
      this.exit_set = false
    }

    set exit_point(s: Statement) {
      if (this.exit_set == true) {
        throw new Error('No se puede establecer el punto de salida de un Statement mas de una vez.')
      }
      else {
        this._exit_point = s
        this.exit_set = true
      }
    }

    get exit_point(): Statement {
      return this._exit_point
    }
  }

  export class Alias extends BaseStatement {
    readonly kind: StatementKinds.Alias
    readonly varname: string
    readonly var_indexes: number
    readonly local_alias: string
    readonly dimensions: number[]
    readonly module_name: string

    constructor (owner: string, varname: string, indexes: number, dimensions: number[], alias: string, module_name: string) {
      super(owner)
      this.kind = StatementKinds.Alias
      this.varname = varname
      this.var_indexes = indexes
      this.local_alias = alias
      this.dimensions = dimensions
      this.module_name = module_name
    }
  }

  export class AssignString extends BaseStatement {
    readonly kind: StatementKinds.AssignString
    readonly length: number
    readonly varname: string
    readonly indexes: number

    constructor (owner: string, varname: string, length: number, indexes: number) {
      super(owner)
      this.kind = StatementKinds.AssignString
      this.varname = varname
      this.length = length
      this.indexes = indexes
    }
  }

  export class Concat extends BaseStatement {
    readonly kind: StatementKinds.Concat
    readonly length: number

    constructor (owner: string, length: number) {
      super(owner)
      this.kind = StatementKinds.Concat
      this.length = length
    }
  }

  export class Return extends BaseStatement {
    readonly kind: StatementKinds.Return

    constructor(owner: string) {
      super(owner)
      this.kind = StatementKinds.Return
    }
  }

  export class UserModuleCall extends BaseStatement {
    readonly kind: StatementKinds.UserModuleCall

    constructor(owner: string, readonly name: string, readonly total_args: number) {
      super(owner)
      this.kind = StatementKinds.UserModuleCall
    }
  }

  export class ReadCall extends BaseStatement {
    readonly name: 'leer'
    readonly kind: StatementKinds.ReadCall
    /**
     * Tipo de datos de la variable que v a a recibir el dato
     * leido.
     */
    readonly type: Typed.AtomicType | Typed.StringType

    constructor(owner: string, readonly varname: string, type: Typed.AtomicType | Typed.StringType) {
      super(owner)
      this.kind = StatementKinds.ReadCall
      this.name = 'leer'
      this.type = type
    }
  }

  export class WriteCall extends BaseStatement {
    readonly name: 'escribir'
    readonly kind: StatementKinds.WriteCall

    constructor(owner: string) {
      super(owner)
      this.kind = StatementKinds.WriteCall
      this.name = 'escribir'
    }
  }

  export class Assign extends BaseStatement {
    readonly kind: StatementKinds.Assign

    constructor(owner: string, readonly varname: string) {
      super(owner)
      this.kind = StatementKinds.Assign
    }
  }

  export class AssignV extends BaseStatement {
    readonly kind: StatementKinds.AssignV

    constructor(owner: string, readonly total_indexes: number, readonly dimensions: number[], readonly varname: string) {
      super(owner)
      this.kind = StatementKinds.AssignV
    }
  }

  export class Get extends BaseStatement {
    readonly kind: StatementKinds.Get

    constructor(owner: string, readonly varname: string) {
      super(owner)
      this.kind = StatementKinds.Get
    }
  }

  export class GetV extends BaseStatement {
    readonly kind: StatementKinds.GetV

    constructor(owner: string, readonly total_indexes: number, readonly dimensions: number[], readonly varname: string) {
      super(owner)
      this.kind = StatementKinds.GetV
    }
  }

  export class Push extends BaseStatement {
    readonly kind: StatementKinds.Push

    constructor(owner: string, readonly value: number | boolean | string) {
      super(owner)
      this.kind = StatementKinds.Push
    }
  }

  export class Pop extends BaseStatement {
    readonly kind: StatementKinds.Pop

    constructor(owner: string) {
      super(owner)
      this.kind = StatementKinds.Pop
    }
  }

  export class Operation extends BaseStatement {

    constructor(owner: string, readonly kind: OperationKinds) {
      super(owner)
    }
  }

  export class While extends BaseStatement {
    readonly kind: StatementKinds.While

    constructor(owner: string, readonly entry_point: Statement) {
      super(owner)
      this.kind = StatementKinds.While
    }
  }

  export class Until extends BaseStatement {
    readonly kind: StatementKinds.Until

    constructor(owner: string, readonly entry_point: Statement) {
      super(owner)
      this.kind = StatementKinds.Until
    }
  }

  export class If extends BaseStatement {
    readonly kind: StatementKinds.If

    constructor(owner: string, readonly true_branch_entry: Statement, readonly false_branch_entry: Statement) {
      super(owner)
      this.kind = StatementKinds.If
    }

    set exit_point(s: Statement) {
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

    get exit_point(): Statement {
      return this._exit_point
    }
  }

  export type OperationKinds = MathOps | ComparisonOps | LogicOps

  export type MathOps = StatementKinds.Plus | StatementKinds.Minus | StatementKinds.Times | StatementKinds.Slash | StatementKinds.Power | StatementKinds.Div | StatementKinds.Mod

  export type ComparisonOps = StatementKinds.Minor | StatementKinds.MinorEq | StatementKinds.Different | StatementKinds.Equal | StatementKinds.Major | StatementKinds.MajorEq

  export type LogicOps = StatementKinds.And | StatementKinds.Or | StatementKinds.Not

  export type Statement = While
    | If
    | Until
    | UserModuleCall
    | ReadCall
    | WriteCall
    | Assign
    | Get
    | Operation
    | AssignV
    | GetV
    | Push
    | Pop
    | Return
    | Concat
    | AssignString
    | Alias;

}

/**
 * Stage 4:
 */

export namespace Typed {
  export type Error = Errors.ExtraIndexes
    | Errors.IncompatibleOperand
    | Errors.IncompatibleOperands
    | Errors.MissingOperands
    | Errors.BadComparisonOperands
    | Errors.LongString;

  export interface Program {
    modules: {
      main: Module
      [m: string]: Module
    }
    
    variables_per_module: {
      main: S1.VariableDict
      [p: string]: S1.VariableDict
    }
  }

  export interface Module {
    module_type: 'function' | 'procedure' | 'main'
    body: Statement[]
    return_type: 'entero' | 'real' | 'caracter' | 'logico' | 'ninguno'
    parameters: Parameter[]
  }

  export interface Parameter {
    name: string
    by_ref: boolean
    type: Type
    is_array: boolean
    dimensions: number[]
  }

  export type Statement = For
    | While
    | Until
    | If
    | Assignment
    | Call
    | Return;

  export interface Return {
    type: 'return'
    expression: ExpElement[]
    typings: {
      actual: Type
      expected: Type
    }
  }

  export interface For {
    type: 'for'
    counter_init: Assignment
    last_value: ExpElement[]
    body: Statement[]
    typings: {
      init_value: Type
      last_value: Type
    }
  }

  export interface While {
    type: 'while'
    condition: ExpElement[]
    body: Statement[]
    typings: {
      condition: Type
      body: Statement[]
    }
  }

  export interface Until {
    type: 'until'
    condition: ExpElement[]
    body: Statement[]
    typings: {
      condition: Type
      body: Statement[]
    }
  }

  export interface If {
    type: 'if'
    true_branch: Statement[]
    false_branch: Statement[]
    condition: ExpElement[]
    typings: {
      condition: Type
    }
  }

  export interface Assignment {
    type: 'assignment'
    left: Invocation
    right: ExpElement[]
    typings: {
      left: Type
      right: Type
    }
  }

  export interface Invocation {
    type: 'invocation'
    name: string
    is_array: boolean
    indexes: ExpElement[][]
    dimensions: number[]
    typings: {
      type: Type
      indexes: Type[]
    }
  }

  export interface Call {
    type: 'call'
    name: string
    args: ExpElement[][]
    parameters: S0.Parameter[]
    typings: {
      args: Type[]
      return: AtomicType
      parameters: Type[]
    }
  }

  export interface Literal extends S0.LiteralValue {
    typings: {
      type: Typed.AtomicType | Typed.StringType
    }
  }

  export type ExpElement = Literal | Invocation | Call | Operator

  export interface Type {
    type: 'type'
    kind: 'atomic' | 'array'
    /**
     * Esta propiedad indica si este tipo pertenece a un valor
     * literal o a un valor invocado.
     */
    represents: 'literal' | 'invocation'
  }

  export interface Operator {
    type: 'operator'
    name: string
  }

  export class ArrayType implements Type {
    readonly type: 'type'
    readonly kind: 'array'
    readonly length: number
    readonly cell_type: Type
    readonly represents: 'literal' | 'invocation'

    constructor(represents: 'literal' | 'invocation', element_type: Type, length: number) {
      this.kind = 'array'
      this.type = 'type'
      this.length = length
      this.cell_type = element_type
      this.represents = represents
    }
  }

  export class AtomicType implements Type {
    readonly type: 'type'
    readonly kind: 'atomic'
    readonly typename: TypeNameString
    readonly represents: 'literal' | 'invocation'

    constructor(represents: 'literal' | 'invocation', tn: TypeNameString) {
      this.kind = 'atomic'
      this.type = 'type'
      this.typename = tn
      this.represents = represents
    }
  }

  export class StringType extends ArrayType {
    constructor(length: number, represents: 'literal' | 'invocation') {
      super(represents, new AtomicType(represents, 'caracter'), length)
    }
  }
}

export type CompileError = Failure<Errors.RepeatedVar[] | S2.Error[] | Typed.Error[] | Errors.TypeError[]>

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
  type: Typed.AtomicType | Typed.StringType
  name: string
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