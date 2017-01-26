declare namespace pli {
    interface BaseError {
        reason: string
        pos?: {
            column: number
            line: number
        }
    }
    /**
     * Interfaces que representan el retorno de una funcion que puede fallar
     */
    interface Failure<A> {
    error: true,
    result: A
    }

    interface Success<A> {
    error: false,
    result: A
    }

    /**
     * Interfaz para errores lexicos
     */
    interface LexicalError {
        unexpected : string
        expected : string[],
        reason : string,
        column : number
        line : number
    }

    /**
     * Interfaces para elementos sintacticos
     */
    enum ValueKind {
        Integer = 0,
        Real = 1,
        String = 2,
    }
    enum SymbolKind {
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
    enum ReservedKind {
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
    enum OtherKind {
        Word = 53,
        Unknown = 54,
    }

    /**
     * Interfaz de un token generico
     */
    interface Token {
    kind: ValueKind | SymbolKind | OtherKind | ReservedKind 
    column: number
    line: number
    error_found: boolean
    error_info: LexicalError
    name: string
    value?: number | string
    text?: string
    }

    type TokenKind = ValueKind | ReservedKind | SymbolKind | OtherKind

    /**
     * ====================================================
     * PARSING INTERFACES
     * ====================================================
     */

    /**
     * Represents an error produced while trying to match a syntactic pattern
     */
    interface PatternError {
    unexpected: ValueKind | ReservedKind | SymbolKind | OtherKind,
    expected: string[],
    column: number,
    line: number,
    reason?: string
    }

    type DataTypeKind = ReservedKind.Entero | ReservedKind.Real | ReservedKind.Logico | ReservedKind.Caracter

    type TypeNameString = 'entero' | 'real' | 'logico' | 'caracter'

    /**
     * Stage0 (not yet transformed) statements and expressions
     */
    namespace S0 {
        interface NumberInfo {
            value: number,
            type: ValueKind.Integer | ValueKind.Real
        }

        type Statement = Call | Assignment | If | While | For | Until | Return | Declaration

        interface DeclarationInfo {
            name: string
            is_array: boolean
            dimensions: number[] 
        }

        /**
         * InvocationInfo se usa del lado izquierdo de
         * una asignacion, es decir, contiene informacion
         * sobre la variable a la que se va a asignar algo.
         */
        interface InvocationInfo {
            name: string
            is_array: boolean
            indexes: ExpElement[][]
        }

        type ExpValue = LiteralValue  | InvocationValue | Call

        interface ExpElement {
            type: 'invocation' | 'literal' | 'operator' | 'parenthesis' | 'call'
            name?: string
        }

        interface LiteralValue {
            type: 'literal'
            value: boolean | string | number
        }

        interface InvocationValue {
            type: 'invocation'
            name: string
            is_array: boolean
            indexes: ExpElement[][]
        }

        interface OperatorElement extends ExpElement {
            type: 'operator'
            name: 'plus' | 'minus' | 'slash' | 'times' | 'power' | 'minor-eq' | 'different' | 'minor' | 'major-eq' | 'major' | 'equal' | 'and' | 'or' | 'not' | 'div' | 'mod'
        }

        interface Parameter {
            name: string
            by_ref: boolean
            type: TypeNameString
            is_array: boolean
            dimensions: number[]
        }

        interface Call {
            type: 'call'
            args: ExpElement[][]
            name: string
        }

        interface Assignment {
            type: 'assignment'
            left: InvocationInfo
            right: ExpElement[]
        }

        interface If {
            type: 'if'
            condition: ExpElement[]
            true_branch: Statement[]
            false_branch: Statement[]
        }

        interface While {
            type: 'while'
            condition: ExpElement[]
            body: Statement[]
        }

        interface For {
            type: 'for'
            counter_init: Assignment
            last_value: ExpElement[]
            body: Statement[]
        }

        interface Until {
            type: 'until'
            condition: ExpElement[]
            body: Statement[]
        }

        interface Return {
            type: 'return'
            expression: ExpElement[]
        }

        interface TypedDeclaration extends DeclarationInfo {
            datatype: TypeNameString
        }

        interface Declaration {
            type: 'declaration'
            variables: TypedDeclaration[]
        }

        type Module = Function | Procedure 

        interface Main {
            type: 'module'
            name: 'main'
            module_type: 'main'
            body: Statement[]
        }

        interface Function {
            type: 'module'
            name: string
            module_type: 'function'
            body: Statement[]
            parameters: Parameter[]
            return_type: 'entero' | 'real' | 'caracter' | 'logico'
        }

        interface Procedure {
            type: 'module'
            name: string
            module_type: 'procedure'
            body: Statement[]
            parameters: Parameter[]
            return_type: 'ninguno'
        }
    }

    interface ParsedProgram {
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

    namespace S1 {
        /**
         * Interface of this stage's final result
         */
        interface AST {
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

        interface TransformedModule {
            new_module: Module
            locals: VariableDict
        }

        interface TransformedMain {
            new_module: Main
            locals: VariableDict
        }

        type Module = Function | Procedure 

        interface Main {
            type: 'module'
            name: 'main'
            module_type: 'main'
            body: Statement[]
        }

        interface Function {
            type: 'module'
            name: string
            module_type: 'function'
            body: Statement[]
            parameters: S0.Parameter[]
            return_type: 'entero' | 'real' | 'caracter' | 'logico'
        }

        interface Procedure {
            type: 'module'
            name: string
            module_type: 'procedure'
            body: Statement[]
            parameters: S0.Parameter[]
            return_type: 'ninguno'
        }

        type Statement = S0.Call | Assignment | If | While | For | Until | S0.Return

        interface Assignment extends S0.Assignment {
            body: Statement[]
        }

        interface If extends S0.If {
            true_branch: Statement[]
            false_branch: Statement[]
        }

        interface While extends S0.While {
            body: Statement[]
        }

        interface For extends S0.For {
            body: Statement[]
        }

        interface Until extends S0.Until {
            body: Statement[]
        }

        interface ArrayVariable extends S0.TypedDeclaration {
            is_array: true
            values: any[]
        }

        interface VariableDict {
            [v:string]: Variable
        }

        type Variable = ArrayVariable | RegularVariable

        interface RegularVariable extends S0.TypedDeclaration {
            is_array: false
            value: any
        }

        interface RepeatedVarError {
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

        interface UndefinedVariable {
            name: string
            reason: 'undefined-variable'
        }

        type Error = UndefinedModule | UndefinedVariable

        interface AST {
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
        interface ModuleCall extends S0.Call {
            args: ExpElement[][]
            module_type: 'function' | 'procedure'
            parameters: S0.Parameter[]
            return_type: 'entero' | 'real' | 'caracter' | 'logico' | 'ninguno' 
        }

        interface Assignment {
            type: 'assignment'
            left: InvocationInfo
            right: ExpElement[]
        }

        type ExpValue = InvocationValue | ModuleCall | S0.LiteralValue
        
        type ExpElement = ExpValue | S0.OperatorElement

        interface If extends S0.If {
            condition: ExpElement[]
            true_branch: Statement[]
            false_branch: Statement[]
        }

        interface While extends S0.While {
            condition: ExpElement[]
            body: Statement[]
        }

        interface For extends S0.For {
            last_value: ExpElement[]
            body: Statement[]
            counter_init: Assignment
        }

        interface Until extends S0.Until {
            condition: ExpElement[]
            body: Statement[]
        }

        type Statement = ReadCall | WriteCall | ModuleCall | Assignment | If | While | For | Until | S0.Return 

        interface ReadCall extends S0.Call {
            args: ExpElement[][]
            name: 'leer'
        }

        interface WriteCall extends S0.Call {
            args: ExpElement[][]
            name: 'escribir'
        }

        type Module = Function | Procedure 

        interface Main {
            type: 'module'
            name: 'main'
            module_type: 'main'
            body: Statement[]
        }

        interface Function {
            type: 'module'
            name: string
            module_type: 'function'
            body: Statement[]
            parameters: S0.Parameter[]
            return_type: 'entero' | 'real' | 'caracter' | 'logico'
        }

        interface Procedure {
            type: 'module'
            name: string
            module_type: 'procedure'
            body: Statement[]
            parameters: S0.Parameter[]
            return_type: 'ninguno'
        }

        interface VarInfo {
            datatype: TypeNameString
            dimensions: number[]
            is_array: boolean
        }

        interface InvocationInfo extends S0.InvocationInfo {
            datatype: TypeNameString
            dimensions: number[]
            indexes: ExpElement[][]
        }

        interface InvocationValue extends S0.InvocationValue {
            dimensions: number[]
            datatype: TypeNameString
            indexes: ExpElement[][]
        }
    }

    /**
     * Stage 3: transforms a program into another that's equivalent
     * and can be executed by the interpreter
     */
    namespace S3 {
        interface Program {
            entry_point: Statement
            modules: {
                [p:string] : Module
            }
            local_variables: {
                main: S1.VariableDict
                [p:string] : S1.VariableDict
            }
        }

        interface Module {
            name: string
            entry_point: Statement
            parameters: {
                [p: string]: Parameter
            }
        }

        interface Parameter {
            name: string
            by_ref: boolean
            is_array: boolean
        }

        function get_last (s: Statement) : Statement;

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
        }

        class BaseStatement {
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

            constructor (name: string, total_args: number)
        }

        class ReadCall extends BaseStatement {
            readonly name: 'leer'
            readonly kind: StatementKinds.ReadCall
            readonly varname: string

            constructor (varname: string)
        }

        class WriteCall extends BaseStatement {
            readonly name: 'escribir'
            readonly kind: StatementKinds.WriteCall

            constructor ()
        }

        class Assign extends BaseStatement {
            readonly kind: StatementKinds.Assign
            readonly varname: string

            constructor (varname: string)
        }

        class AssignV extends BaseStatement {
            readonly kind: StatementKinds.AssignV
            readonly total_indexes: number
            readonly dimensions: number[]
            readonly varname: string

            constructor (total_indexes: number, dimensions: number[], varname: string)
        }

        class Get extends BaseStatement {
            readonly kind: StatementKinds.Get
            readonly varname: string
            
            constructor (varname: string)
        }

        class GetV extends BaseStatement {
            readonly kind: StatementKinds.GetV
            readonly total_indexes: number
            readonly dimensions: number[]
            readonly varname: string
            
            constructor (total_indexes: number, dimensions: number, varname: string)
        }

        class Push extends BaseStatement {
            readonly kind: StatementKinds.Push
            readonly value: number | boolean | string
            
            constructor (value: number | boolean | string)
        }

        class Pop extends BaseStatement {
            readonly kind: StatementKinds.Pop
            
            constructor ()
        }

        class Operation extends BaseStatement {
            readonly kind: OperationKinds

            constructor (kind: OperationKinds)
        }

        class While extends BaseStatement {
            readonly kind: StatementKinds.While
            readonly entry_point: Statement

            constructor (entry_point: Statement)
        }

        class Until extends BaseStatement {
            readonly kind: StatementKinds.Until
            readonly entry_point: Statement

            constructor (entry_point: Statement)
        }

        class If extends BaseStatement {
            readonly kind: StatementKinds.If
            readonly true_branch_entry: Statement
            readonly false_branch_entry: Statement
            exit_point: Statement
            
            constructor (true_branch_entry: Statement, false_branch_entry: Statement)
        }

        type OperationKinds = MathOps | ComparisonOps | LogicOps

        type MathOps = StatementKinds.Plus  | StatementKinds.Minus | StatementKinds.Times | StatementKinds.Slash | StatementKinds.Power | StatementKinds.Div | StatementKinds.Mod

        type ComparisonOps = StatementKinds.Minor | StatementKinds.MinorEq | StatementKinds.Different | StatementKinds.Equal | StatementKinds.Major | StatementKinds.MajorEq

        type LogicOps = StatementKinds.And | StatementKinds.Or | StatementKinds.Not

        type Statement = While | If | Until | UserModuleCall | ReadCall | WriteCall | Assign | Get | Operation | AssignV | GetV | Push | Pop | Return
    }

    /**
     * Stage 4:
     */
    namespace Typed {
        interface ExtraIndexesError {
            reason: '@invocation-extra-indexes'
            name: string
            dimensions: number
            indexes: number
        }

        interface Program {
            [m:string]: Module
        }

        interface Module {
            module_type: 'function' | 'procedure' | 'main'
            body: Statement[]
            return_type: 'entero' | 'real' | 'caracter' | 'logico' | 'ninguno'
            parameters: S0.Parameter[]
        }

        type Statement = For
            | While
            | Until
            | If
            | Assignment;
            // | Call
            // | Return
            // | ReadCall
            // | WriteCall;

        interface For {
            type: 'for'
            counter_init: ExpElement[]
            last_value: ExpElement[]
            body: Statement[]
        }

        interface While {
            type: 'while'
            condition: ExpElement[]
            body: Statement[]
        }

        interface Until {
            type: 'until'
            condition: ExpElement[]
            body: Statement[]
        }

        interface If {
            type: 'if'
            condition: ExpElement[]
            true_branch: Statement[]
            false_branch: Statement[]
        }

        interface Assignment {
            type: 'assignment'
            left: Invocation
            right: ExpElement[]
        }

        interface Invocation {
            type: 'invocation'
            datatype: Type
            indextypes: ExpElement[][]
        }

        type ExpElement = Type | Invocation | Operator

        interface Type {
            type: 'type'
            kind: 'atomic' | 'array'
        }

        interface Operator {
            type: 'operator'
            name: string
        }

        class ArrayType implements Type {
            type: 'type'
            kind: 'array'
            length: number
            cell_type: Type

            constructor(element_type: Type, length: number)
        }

        class AtomicType implements Type {
            type: 'type'
            kind: 'atomic'
            typename: TypeNameString

            constructor (tn: TypeNameString)
        }

        class StringType extends ArrayType {
            constructor(length: number)
        }
    }

    type TransformError = Failure<S1.RepeatedVarError[]> | Failure<(S2.UndefinedModule | S2.UndefinedVariable)[]> | Failure<Typed.ExtraIndexesError[]>

    interface TransformedProgram {
        typed_program: Typed.Program,
        program: S3.Program
    }

    interface TypeError {
        where: 'typechecker'
        reason: string
    }

    interface MissingOperands extends TypeError {
        reason: 'missing-operands'
        operator: string
        required: number
    }

    interface IncompatibleOperand extends TypeError {
        reason: 'incompatible-operand'
        operator: string
        bad_type: string
    }

    interface IncompatibleOperands extends TypeError {
        reason: 'incompatible-operands'
        operator: string
        bad_type_a: string
        bad_type_b: string
    }

    interface IncompatibleTypesError extends TypeError {
        reason: '@assignment-incompatible-types'
        expected: string
        received: string
    }
}

declare namespace pli {
    type ICallback = (...params: any[]) => void;

    class Emitter {
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
}

declare namespace pli {
    /**
     * Value
     * representa un valor resultante de una expresion
     */
    type Value = boolean | number | string 

    interface OutOfBounds {
    reason: '@invocation-index-out-of-bounds' | '@assignment-index-out-of-bounds'
    // agregar estas mas adelante 
    // line: number
    // column: number
    name: string
    bad_index: number
    dimensions: number[]
    /**
     * Sirve para indicar que el evaluador terminó la ejecución.
     * Está acá para que todos los retornos del evaluador tengan
     * esta prop.
     */
    done: boolean
    }

    interface Read {
    action: 'read'
    // agregar esto mas adelante
    // type: 'entero' | 'real' | 'caracter' | 'cadena'
    done: boolean
    }

    interface Write {
    action: 'write',
    value: Value
    done: boolean
    }

    interface NullAction {
    action: 'none'
    done: boolean
    }

    interface Paused {
    action: 'paused'
    done: boolean
    }

    type SuccessfulReturn = Success<Read> | Success<Write> | Success<NullAction>
}

declare namespace pli {
    class Parser extends Emitter {
        constructor();
        parse(code: string): Failure<string> | Success<ParsedProgram>;
    }

    class Interpreter extends Emitter {
        private evaluator;
        running: boolean;
        paused: boolean;
        data_read: boolean;
        constructor(p: S3.Program);
        run(): void;
        send(value: Value): void;
    }
}

declare namespace pli {
    function transform (p: ParsedProgram) : TransformError | Success<TransformedProgram>
    
    function typecheck (p: Typed.Program): TypeError[]
}

export = pli;