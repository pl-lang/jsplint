import {VariableDict} from './Stage1'

export class Node<A> {
  data: A
  private _next: Node<A>

  constructor (data?: A) {
      if (data) {
          this.data = data
      }
      this._next = null
  }

  set next (n: Node<A>) {
      this._next = n
  }

  get next () {
      return this._next
  }
}

export function get_last (s: Statement) : Statement {
    let current = s
    while (s.exit_point !== null) {
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
        [p:string] : VariableDict
    }
}

export interface Module {
    name: string
    module_type: 'function' | 'procedure'
    entry_point: Statement
    parameters: string[] // por ahora solo voy a poner los nombres de los parametros aca
    return_type?: string // por ahora esto no se usa...si no sirve lo saco
}

export type Statement = While | If | Until | If | UserModuleCall | ReadCall | WriteCall | Assign | Get | Operation | AssignV | GetV | Push | Pop

export interface While {
    kind: StatementKinds.While
    entry_point: Statement
    exit_point: Statement
}

export interface Until {
    kind: StatementKinds.Until
    entry_point: Statement
    exit_point: Statement
}

export interface If {
    kind: StatementKinds.If
    true_branch_entry: Statement
    false_branch_entry: Statement
    exit_point: Statement
}

export interface UserModuleCall {
    kind: StatementKinds.UserModuleCall
    name: string
    total_args: number
    exit_point: Statement
}

export interface ReadCall {
    kind: StatementKinds.ReadCall
    name: 'leer'
    varname: string
    exit_point: Statement
}

export interface WriteCall {
    kind: StatementKinds.WriteCall
    name: 'escribir'
    exit_point: Statement
}

export interface Assign {
    kind: StatementKinds.Assign
    varname: string
    exit_point: Statement
}

export interface AssignV {
    kind: StatementKinds.Assign
    total_indexes: number
    varname: string
    exit_point: Statement
}

export interface Get {
    kind: StatementKinds.Get
    varname: string
    exit_point: Statement
}

export interface GetV {
    kind: StatementKinds.GetV
    total_indexes: number
    varname: string
    exit_point: Statement
}

export interface Push {
    value: number | boolean | string
    exit_point: Statement
}

export interface Pop {
    exit_point: Statement
}

export interface Operation {
    kind: OperationKinds
    exit_point: Statement
}

export type OperationKinds = MathOps | VarOps | StackOps | ComparisonOps | LogicOps

type MathOps = StatementKinds.Plus  | StatementKinds.Minus | StatementKinds.Times | StatementKinds.Slash | StatementKinds.Power | StatementKinds.Div | StatementKinds.Mod

type VarOps = StatementKinds.Assign | StatementKinds.Get | StatementKinds.AssignV | StatementKinds.GetV

type StackOps = StatementKinds.Push | StatementKinds.Pop

type ComparisonOps = StatementKinds.Minor | StatementKinds.MinorEq | StatementKinds.Different | StatementKinds.Equal | StatementKinds.Major | StatementKinds.MajorEq

type LogicOps = StatementKinds.And | StatementKinds.Or | StatementKinds.Not

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
  LeftPar,
  RightPar,
  LeftBracket,
  RightBracket,
  Comma,
  If,
  While,
  Until,
  UserModuleCall,
  ReadCall,
  WriteCall,
  Return
}