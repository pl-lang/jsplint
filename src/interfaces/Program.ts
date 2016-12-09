import {VariableDict} from './Stage1'

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

export function get_last (s: Statement) : Statement {
    let current = s
    while (current.exit_point !== null) {
        current = current.exit_point
    }
    return current
}

export interface Program {
    entry_point: Statement
    modules: {
        [p:string] : Module
    }
    local_variables: {
        main: VariableDict
        [p:string] : VariableDict
    }
}

/**
 * Funcion que establece el exit_point de un Statement.
 * No devuelve nada, solo modifica un objeto
 */
export function set_exit (s: Statement, new_exit: Statement) : void {
    s.exit_point = new_exit
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

export type Statement = While | If | Until | UserModuleCall | ReadCall | WriteCall | Assign | Get | Operation | AssignV | GetV | Push | Pop | Return

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

export type OperationKinds = MathOps | ComparisonOps | LogicOps

export type MathOps = StatementKinds.Plus  | StatementKinds.Minus | StatementKinds.Times | StatementKinds.Slash | StatementKinds.Power | StatementKinds.Div | StatementKinds.Mod

export type ComparisonOps = StatementKinds.Minor | StatementKinds.MinorEq | StatementKinds.Different | StatementKinds.Equal | StatementKinds.Major | StatementKinds.MajorEq

export type LogicOps = StatementKinds.And | StatementKinds.Or | StatementKinds.Not

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