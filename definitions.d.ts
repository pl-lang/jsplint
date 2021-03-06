export type ICallback = (...params: any[]) => void;

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

export interface Failure<A> {
  error: true;
  result: A;
}
export interface Success<A> {
  error: false;
  result: A;
}

export namespace Errors {
  type TypeError = IncompatibleArgument | IncompatibleTypes | BadWriteArg | BadCondition | BadCounter | BadInitValue | BadLastValue | BadReturn | WrongArgAmount | BadIndex | LongString | BadRefArg | BadReadArg;
  interface Base {
    reason: string;
    where: string;
    pos?: Position;
  }
  /**
   * Emitido cuando se pasa un literal a 'leer'
   */
  interface BadReadArg extends Base {
    reason: '@read-bad-arg';
    where: 'typechecker';
    /**
     * Indice del argumento literal que de esta llamada
     */
    index: number;
  }
  /**
   * Emitido cuando se llama un modulo con un literal como
   * parametro por referencia
   */
  interface BadRefArg extends Base {
    reason: '@call-bad-ref-arg';
    where: 'typechecker';
    /**
     * Tipo del parametro en cuestion
     */
    param_expected: string;
    /**
     * Nombre del parametro en cuestion
     */
    param_name: string;
    /**
     * Nombre del modulo al que pertenece
     */
    module: string;
    /**
     * Tipo del valor literal recibido como argumento
     */
    received: string;
    /**
     * Indice (en la lista de parametros del modulo)
     */
    index: number;
  }
  interface LongString extends Base {
    reason: '@assignment-long-string' | '@read-long-string';
    where: 'typechecker' | 'interpreter';
    name: string;
    type: string;
    vector_length: number;
    string_length: number;
  }
  interface BadIndex extends Base {
    reason: '@invocation-bad-index';
    where: 'typechecker';
    received: string;
    name: string;
    at: number;
  }
  interface WrongArgAmount extends Base {
    reason: '@call-wrong-arg-amount';
    where: 'typechecker';
    expected: number;
    received: number;
    name: string;
  }
  interface BadComparisonOperands extends Base {
    reason: '@comparison-bad-operands';
    where: 'typer';
    left: string;
    right: string;
  }
  interface Lexical extends Base {
    unexpected: string;
    expected: string[];
  }
  interface UndefinedModule extends Base {
    name: string;
    reason: '@call-undefined-module';
    where: 'call-decorator-transform';
  }
  interface UndefinedVariable extends Base {
    name: string;
    reason: 'undefined-variable';
    where: 'call-decorator-transform';
  }
  interface Pattern extends Base {
    unexpected: ValueKind | ReservedKind | SymbolKind | OtherKind;
    expected: string[];
    reason: string;
    where: 'parser';
  }
  interface RepeatedVar extends Base {
    reason: 'repeated-variable';
    name: string;
    first_type: string;
    second_type: string;
    where: 'declarator-transform';
  }
  interface ExtraIndexes extends Base {
    reason: '@invocation-extra-indexes';
    name: string;
    dimensions: number;
    indexes: number;
    where: 'typer';
  }
  interface MissingOperands extends Base {
    reason: 'missing-operands';
    where: 'typer';
    operator: string;
    required: number;
  }
  interface IncompatibleOperand extends Base {
    reason: 'incompatible-operand';
    where: 'typer';
    operator: string;
    bad_type: string;
  }
  interface IncompatibleOperands extends Base {
    reason: 'incompatible-operands';
    where: 'typer';
    operator: string;
    bad_type_a: string;
    bad_type_b: string;
  }
  interface IncompatibleTypes extends Base {
    reason: '@assignment-incompatible-types' | '@read-incompatible-types';
    where: 'typechecker' | 'interpreter';
    expected: string;
    received: string;
  }
  interface IncompatibleArgument extends Base {
    reason: '@call-incompatible-argument';
    name: string;
    where: 'typechecker';
    expected: string;
    received: string;
    index: number;
  }
  interface BadWriteArg extends Base {
    reason: 'bad-write-arg';
    where: 'typechecker';
    received: string;
    index: number;
    name: string;
  }
  interface OutOfBounds extends Base {
    reason: 'index-out-of-bounds';
    where: 'evaluator';
    name: string;
    bad_index: number;
    dimensions: number[];
    /**
     * Propiedad especifica de los retornos del evaluador
     */
    done: boolean;
  }
  interface BadCondition extends Base {
    reason: 'bad-condition';
    where: 'typechecker';
    received: string;
  }
  interface BadCounter extends Base {
    reason: '@for-bad-counter';
    where: 'typechecker';
    received: string;
  }
  interface BadInitValue extends Base {
    reason: '@for-bad-init';
    where: 'typechecker';
    received: string;
  }
  interface BadLastValue extends Base {
    reason: '@for-bad-last';
    where: 'typechecker';
    received: string;
  }
  interface BadReturn extends Base {
    reason: 'bad-return';
    where: 'typechecker';
    declared: string;
    received: string;
  }
}

export namespace S0 {
  interface NumberInfo {
    value: number;
    type: ValueKind.Integer | ValueKind.Real;
  }
  type Statement = Call | Assignment | If | While | For | Until | Return | Declaration;
  interface DeclarationInfo {
    name: string;
    is_array: boolean;
    dimensions: number[];
  }
  /**
   * InvocationInfo se usa del lado izquierdo de
   * una asignacion, es decir, contiene informacion
   * sobre la variable a la que se va a asignar algo.
   */
  interface InvocationInfo {
    name: string;
    is_array: boolean;
    indexes: ExpElement[][];
  }
  type ExpValue = LiteralValue | InvocationValue | Call;
  interface ExpElement {
    type: 'invocation' | 'literal' | 'operator' | 'parenthesis' | 'call';
    name?: string;
  }
  interface LiteralValue {
    type: 'literal';
    value: boolean | string | number;
  }
  interface InvocationValue {
    type: 'invocation';
    name: string;
    is_array: boolean;
    indexes: ExpElement[][];
  }
  interface OperatorElement extends ExpElement {
    type: 'operator';
    name: 'plus' | 'minus' | 'slash' | 'times' | 'power' | 'minor-eq' | 'different' | 'minor' | 'major-eq' | 'major' | 'equal' | 'and' | 'or' | 'not' | 'div' | 'mod' | 'neg';
  }
  interface Parameter {
    name: string;
    by_ref: boolean;
    type: TypeNameString;
    is_array: boolean;
    dimensions: number[];
  }
  interface Call {
    type: 'call';
    args: ExpElement[][];
    name: string;
    pos: Position;
  }
  interface Assignment {
    type: 'assignment';
    left: InvocationInfo;
    right: ExpElement[];
    pos: Position;
  }
  interface If {
    type: 'if';
    condition: ExpElement[];
    true_branch: Statement[];
    false_branch: Statement[];
    pos: Position;
  }
  interface While {
    type: 'while';
    condition: ExpElement[];
    body: Statement[];
    pos: Position;
  }
  interface For {
    type: 'for';
    counter_init: Assignment;
    last_value: ExpElement[];
    body: Statement[];
    pos: Position;
  }
  interface Until {
    type: 'until';
    condition: ExpElement[];
    body: Statement[];
    pos: Position;
  }
  interface Return {
    type: 'return';
    expression: ExpElement[];
    pos: Position;
  }
  interface TypedDeclaration extends DeclarationInfo {
    datatype: TypeNameString;
    by_ref: boolean;
  }
  interface Declaration {
    type: 'declaration';
    variables: TypedDeclaration[];
    pos: Position;
  }
  type Module = Function | Procedure;
  interface Main {
    type: 'module';
    name: 'main';
    module_type: 'main';
    body: Statement[];
  }
  interface Function {
    type: 'module';
    name: string;
    module_type: 'function';
    body: Statement[];
    parameters: Parameter[];
    return_type: 'entero' | 'real' | 'caracter' | 'logico';
  }
  interface Procedure {
    type: 'module';
    name: string;
    module_type: 'procedure';
    body: Statement[];
    parameters: Parameter[];
    return_type: 'ninguno';
  }
}

export interface ParsedProgram {
  main: S0.Main;
  user_modules: {
    [m: string]: S0.Module;
  };
}

export type TypeNameString = 'entero' | 'real' | 'logico' | 'caracter' | 'ninguno';

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
  Neg = 53,
}
export enum OtherKind {
  Word = 54,
  Unknown = 55,
}

export namespace S3 {
  interface Program {
    entry_point: Statement;
    modules: {
      [p: string]: Module;
    };
    local_variables: {
      main: S1.VariableDict;
      [p: string]: S1.VariableDict;
    };
  }
  interface Module {
    name: string;
    entry_point: Statement;
    parameters: {
      [p: string]: Parameter;
    };
  }
  interface Parameter {
    name: string;
    by_ref: boolean;
    is_array: boolean;
  }
  function get_last(s: Statement): Statement;
  enum StatementKinds {
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
    Concat = 29,
    AssignString = 30,
    Alias = 31,
    CopyVec = 32,
    Neg = 33,
    MakeFrame = 34,
    InitV = 35,
  }
  class BaseStatement {
    readonly kind: StatementKinds;
    protected _exit_point: Statement;
    protected exit_set: boolean;
    readonly owner: string;
    is_user_stmnt: boolean;
    pos?: Position;
    constructor(owner: string);
    exit_point: Statement;
  }
  class MakeFrame extends BaseStatement {
    readonly kind: StatementKinds.MakeFrame;
    /**
     * Nombre del modulo del cual se hara un frame
     */
    readonly name: string;
    constructor(owner: string, name: string);
  }
  class InitV extends BaseStatement {
    readonly kind: StatementKinds.InitV;
    readonly source: VectorData;
    readonly target_name: string;
    constructor(owner: string, source: VectorData, target_name: string);
  }
  interface VectorData {
    name: string;
    indexes: number;
    dimensions: number[];
  }
  class CopyVec extends BaseStatement {
    readonly kind: StatementKinds.CopyVec;
    /**
     * datos del vector que recibe los datos
     */
    readonly target: VectorData;
    /**
     * datos del vector del cual se originan los datos
     */
    readonly source: VectorData;
    pos: Position;
    /**
     * target datos del vector que recibe los datos;
     * source datos del vector del cual se copian los datos;
     */
    constructor(owner: string, target: VectorData, source: VectorData, pos: Position);
  }
  class Alias extends BaseStatement {
    readonly kind: StatementKinds.Alias;
    readonly varname: string;
    readonly var_indexes: number;
    readonly local_alias: string;
    readonly dimensions: number[];
    readonly module_name: string;
    readonly varkind: 'scalar' | 'vector'
    constructor(owner: string, varname: string, indexes: number, dimensions: number[], alias: string, module_name: string, varkind: 'scalar' | 'vector');
  }
  class AssignString extends BaseStatement {
    readonly kind: StatementKinds.AssignString;
    readonly length: number;
    readonly varname: string;
    readonly indexes: number;
    pos?: Position;
    constructor(owner: string, varname: string, length: number, indexes: number, user: boolean, pos?: Position);
  }
  class Concat extends BaseStatement {
    readonly kind: StatementKinds.Concat;
    readonly length: number;
    constructor(owner: string, length: number);
  }
  class Return extends BaseStatement {
    readonly kind: StatementKinds.Return;
    pos: Position;
    constructor(owner: string, pos: Position);
  }
  class UserModuleCall extends BaseStatement {
    readonly name: string;
    readonly total_args: number;
    readonly kind: StatementKinds.UserModuleCall;
    pos: Position;
    constructor(owner: string, name: string, total_args: number, pos: Position);
  }
  class ReadCall extends BaseStatement {
    readonly varname: string;
    readonly name: 'leer';
    readonly kind: StatementKinds.ReadCall;
    pos: Position;
    /**
     * Tipo de datos de la variable que v a a recibir el dato
     * leido.
     */
    readonly type: Typed.AtomicType | Typed.StringType;
    constructor(owner: string, varname: string, type: Typed.AtomicType | Typed.StringType, pos: Position);
  }
  class WriteCall extends BaseStatement {
    readonly name: 'escribir';
    readonly kind: StatementKinds.WriteCall;
    pos: Position;
    constructor(owner: string, pos: Position);
  }
  class Assign extends BaseStatement {
    readonly varname: string;
    readonly kind: StatementKinds.Assign;
    pos: Position;
    constructor(owner: string, varname: string, user: boolean, pos: Position);
  }
  class AssignV extends BaseStatement {
    readonly total_indexes: number;
    readonly dimensions: number[];
    readonly varname: string;
    readonly kind: StatementKinds.AssignV;
    pos?: Position;
    constructor(owner: string, total_indexes: number, dimensions: number[], varname: string, user: boolean, pos?: Position);
  }
  class Get extends BaseStatement {
    readonly varname: string;
    readonly kind: StatementKinds.Get;
    constructor(owner: string, varname: string);
  }
  class GetV extends BaseStatement {
    readonly total_indexes: number;
    readonly dimensions: number[];
    readonly varname: string;
    readonly kind: StatementKinds.GetV;
    constructor(owner: string, total_indexes: number, dimensions: number[], varname: string);
  }
  class Push extends BaseStatement {
    readonly value: number | boolean | string;
    readonly kind: StatementKinds.Push;
    constructor(owner: string, value: number | boolean | string);
  }
  class Pop extends BaseStatement {
    readonly kind: StatementKinds.Pop;
    constructor(owner: string);
  }
  class Operation extends BaseStatement {
    readonly kind: OperationKinds;
    constructor(owner: string, kind: OperationKinds);
  }
  class While extends BaseStatement {
    readonly entry_point: Statement;
    readonly kind: StatementKinds.While;
    pos: Position;
    constructor(owner: string, entry_point: Statement, pos: Position);
  }
  class Until extends BaseStatement {
    readonly entry_point: Statement;
    readonly kind: StatementKinds.Until;
    pos: Position;
    constructor(owner: string, entry_point: Statement, pos: Position);
  }
  class If extends BaseStatement {
    readonly true_branch_entry: Statement;
    readonly false_branch_entry: Statement;
    readonly kind: StatementKinds.If;
    pos: Position;
    constructor(owner: string, true_branch_entry: Statement, false_branch_entry: Statement, pos: Position);
    exit_point: Statement;
  }
  type OperationKinds = MathOps | ComparisonOps | LogicOps;
  type MathOps = StatementKinds.Plus | StatementKinds.Minus | StatementKinds.Times | StatementKinds.Slash | StatementKinds.Power | StatementKinds.Div | StatementKinds.Mod | StatementKinds.Neg;
  type ComparisonOps = StatementKinds.Minor | StatementKinds.MinorEq | StatementKinds.Different | StatementKinds.Equal | StatementKinds.Major | StatementKinds.MajorEq;
  type LogicOps = StatementKinds.And | StatementKinds.Or | StatementKinds.Not;
  type Statement = While | If | Until | UserModuleCall | ReadCall | WriteCall | Assign | Get | Operation | AssignV | GetV | Push | Pop | Return | Concat | AssignString | Alias | CopyVec | MakeFrame | InitV;
}

export interface StatementInfo {
  kind: 'info';
  pos: Position;
  is_user_statement: boolean;
}

export namespace Typed {
  type Error = Errors.ExtraIndexes | Errors.IncompatibleOperand | Errors.IncompatibleOperands | Errors.MissingOperands | Errors.BadComparisonOperands | Errors.LongString;
  interface Program {
    modules: {
      main: Module;
      [m: string]: Module;
    };
    variables_per_module: {
      main: S1.VariableDict;
      [p: string]: S1.VariableDict;
    };
  }
  interface Module {
    module_type: 'function' | 'procedure' | 'main';
    body: Statement[];
    return_type: 'entero' | 'real' | 'caracter' | 'logico' | 'ninguno';
    parameters: Parameter[];
  }
  interface Parameter {
    name: string;
    by_ref: boolean;
    type: Type;
    is_array: boolean;
    dimensions: number[];
  }
  type Statement = For | While | Until | If | Assignment | Call | Return;
  interface Return {
    type: 'return';
    expression: ExpElement[];
    typings: {
      actual: Type;
      expected: Type;
    };
    pos: Position;
  }
  interface For {
    type: 'for';
    counter_init: Assignment;
    last_value: ExpElement[];
    body: Statement[];
    typings: {
      init_value: Type;
      last_value: Type;
    };
    pos: Position;
  }
  interface While {
    type: 'while';
    condition: ExpElement[];
    body: Statement[];
    typings: {
      condition: Type;
      body: Statement[];
    };
    pos: Position;
  }
  interface Until {
    type: 'until';
    condition: ExpElement[];
    body: Statement[];
    typings: {
      condition: Type;
      body: Statement[];
    };
    pos: Position;
  }
  interface If {
    type: 'if';
    true_branch: Statement[];
    false_branch: Statement[];
    condition: ExpElement[];
    typings: {
      condition: Type;
    };
    pos: Position;
  }
  interface Assignment {
    type: 'assignment';
    left: Invocation;
    right: ExpElement[];
    pos: Position;
    typings: {
      left: Type;
      right: Type;
    };
  }
  interface Invocation {
    type: 'invocation';
    name: string;
    is_array: boolean;
    indexes: ExpElement[][];
    dimensions: number[];
    typings: {
      type: Type;
      indexes: Type[];
    };
  }
  interface Call {
    type: 'call';
    name: string;
    args: ExpElement[][];
    parameters: S0.Parameter[];
    typings: {
      args: Type[];
      return: AtomicType;
      parameters: Type[];
    };
    pos: Position;
  }
  interface Literal extends S0.LiteralValue {
    typings: {
      type: Typed.AtomicType | Typed.StringType;
    };
  }
  type ExpElement = Literal | Invocation | Call | Operator;
  interface Type {
    type: 'type';
    kind: 'atomic' | 'array';
    /**
     * Esta propiedad indica si este tipo pertenece a un valor
     * literal o a un valor invocado.
     */
    represents: 'literal' | 'invocation';
  }
  interface Operator {
    type: 'operator';
    name: string;
  }
  class ArrayType implements Type {
    readonly type: 'type';
    readonly kind: 'array';
    readonly length: number;
    readonly cell_type: Type;
    readonly represents: 'literal' | 'invocation';
    constructor(represents: 'literal' | 'invocation', element_type: Type, length: number);
  }
  class AtomicType implements Type {
    readonly type: 'type';
    readonly kind: 'atomic';
    readonly typename: TypeNameString;
    readonly represents: 'literal' | 'invocation';
    constructor(represents: 'literal' | 'invocation', tn: TypeNameString);
  }
  class StringType extends ArrayType {
    constructor(length: number, represents: 'literal' | 'invocation');
  }
}

export namespace S1 {
  /**
   * Interface of this stage's final result
   */
  interface AST {
    modules: {
      main: Main;
      user_modules: {
        [m: string]: Function | Procedure;
      };
    };
    local_variables: {
      main: VariableDict;
      [m: string]: VariableDict;
    };
  }
  interface TransformedModule {
    new_module: Module;
    locals: VariableDict;
  }
  interface TransformedMain {
    new_module: Main;
    locals: VariableDict;
  }
  type Module = Function | Procedure;
  interface Main {
    type: 'module';
    name: 'main';
    module_type: 'main';
    body: Statement[];
  }
  interface Function {
    type: 'module';
    name: string;
    module_type: 'function';
    body: Statement[];
    parameters: S0.Parameter[];
    return_type: 'entero' | 'real' | 'caracter' | 'logico';
  }
  interface Procedure {
    type: 'module';
    name: string;
    module_type: 'procedure';
    body: Statement[];
    parameters: S0.Parameter[];
    return_type: 'ninguno';
  }
  type Statement = S0.Call | Assignment | If | While | For | Until | S0.Return;
  interface Assignment extends S0.Assignment {
    body: Statement[];
  }
  interface If extends S0.If {
    true_branch: Statement[];
    false_branch: Statement[];
  }
  interface While extends S0.While {
    body: Statement[];
  }
  interface For extends S0.For {
    body: Statement[];
  }
  interface Until extends S0.Until {
    body: Statement[];
  }
  interface VariableDict {
    [v: string]: Variable;
  }
  type Variable = ArrayVariable | RegularVariable;
  interface ArrayVariable {
    type: 'array';
    name: string;
    dimensions: number[];
    datatype: TypeNameString;
    by_ref: boolean;
  }
  interface RegularVariable {
    type: 'scalar';
    name: string;
    datatype: TypeNameString;
    by_ref: boolean;
  }
}

export namespace S2 {
  type Error = Errors.UndefinedModule | Errors.UndefinedVariable;
  interface AST {
    modules: {
      main: Main;
      user_modules: {
        [m: string]: Module;
      };
    };
    local_variables: {
      main: S1.VariableDict;
      [m: string]: S1.VariableDict;
    };
  }
  interface ModuleCall extends S0.Call {
    args: ExpElement[][];
    module_type: 'function' | 'procedure';
    parameters: S0.Parameter[];
    return_type: TypeNameString;
    pos: Position;
  }
  interface Assignment {
    type: 'assignment';
    left: InvocationInfo;
    right: ExpElement[];
    pos: Position;
  }
  type ExpValue = InvocationValue | ModuleCall | S0.LiteralValue;
  type ExpElement = ExpValue | S0.OperatorElement;
  interface If extends S0.If {
    condition: ExpElement[];
    true_branch: Statement[];
    false_branch: Statement[];
  }
  interface While extends S0.While {
    condition: ExpElement[];
    body: Statement[];
  }
  interface For extends S0.For {
    last_value: ExpElement[];
    body: Statement[];
    counter_init: Assignment;
  }
  interface Until extends S0.Until {
    condition: ExpElement[];
    body: Statement[];
  }
  interface Return {
    type: 'return';
    expression: ExpElement[];
    expected: TypeNameString;
    pos: Position;
  }
  type Statement = ModuleCall | Assignment | If | While | For | Until | Return;
  type Module = Function | Procedure;
  interface Main {
    type: 'module';
    name: 'main';
    module_type: 'main';
    body: Statement[];
  }
  interface Function {
    type: 'module';
    name: string;
    module_type: 'function';
    body: Statement[];
    parameters: S0.Parameter[];
    return_type: 'entero' | 'real' | 'caracter' | 'logico';
  }
  interface Procedure {
    type: 'module';
    name: string;
    module_type: 'procedure';
    body: Statement[];
    parameters: S0.Parameter[];
    return_type: 'ninguno';
  }
  interface VarInfo {
    datatype: TypeNameString;
    dimensions: number[];
    is_array: boolean;
  }
  interface InvocationInfo extends S0.InvocationInfo {
    datatype: TypeNameString;
    dimensions: number[];
    indexes: ExpElement[][];
  }
  interface InvocationValue extends S0.InvocationValue {
    dimensions: number[];
    datatype: TypeNameString;
    indexes: ExpElement[][];
  }
}

export type CompileError = Failure<Errors.RepeatedVar[] | S2.Error[] | Typed.Error[] | Errors.TypeError[]>;

export type Value = boolean | number | string

export interface Position {
  line: number
  column: number
}

export interface InterpreterStatementInfo {
  kind: 'info'
  type: 'statement'
  pos: Position
}

export interface InterpreterWrite {
  kind: 'action'
  action: 'write'
  value: Value
}

export interface InterpreterRead {
  kind: 'action'
  action: 'read'
}

export interface InterpreterDone {
  kind: 'info'
  type: 'interpreter'
  done: boolean
}

export type BoxedValue = BoxedScalar | BoxedVector

export interface BoxedScalar {
  type: 'scalar'
  value: Value
}

export interface BoxedVector {
  type: 'vector'
  cells: { index: number, value: Value }[]
}


export enum VarState {
  ExistsInit = 0,
  ExistsNotInit = 1,
  ExistsOutOfScope = 2,
  DoesntExist = 3,
}

export type VarInfo = { type: 'scalar' | 'vector', state: VarState }

// exports de este modulo

export class Parser extends Emitter {
  constructor();
  parse(code: string): Failure<Errors.Lexical[] | Errors.Pattern[]> | Success<ParsedProgram>;
}

export class Interpreter {
  private evaluator;
  private paused;
  private data_read;
  private read_stack;
  private current_program;
  private statement_visited;
  private error_ocurred;
  private program_set;
  private last_info;
  private breakpoints;
  constructor();
  program: S3.Program;
  is_done(): boolean;
  run(): Failure<Errors.OutOfBounds> | Success<InterpreterRead | InterpreterWrite | InterpreterDone | InterpreterStatementInfo>;
  step(): Failure<Errors.OutOfBounds> | Success<InterpreterRead | InterpreterStatementInfo | InterpreterWrite>;
  send(value: string): Failure<Errors.IncompatibleTypes | Errors.LongString> | Success<null>;
  parse(value: string): S0.LiteralValue;
  export_var(name: string): BoxedValue;
  search_var(name: string): VarInfo;
}

export function transform(p: ParsedProgram): CompileError | Success<S3.Program>;

export function typecheck(p: Typed.Program): Errors.TypeError[];

export function fr_writer(p: S3.Program): string;