'use strict'

import {ReportInterface, Report} from '../utility/Report.js'

import {take, flatten, mergeObjs} from '../utility/helpers.js'

import {ValueKind, ReservedKind, SymbolKind, OtherKind, Token} from './TokenTypes'

import TokenQueue from './TokenQueue.js'

type TokenKind = ValueKind | ReservedKind | SymbolKind | OtherKind
type DataTypeKind = ReservedKind.Entero | ReservedKind.Real | ReservedKind.Logico | ReservedKind.Caracter

interface PatternError {
  unexpected: ValueKind | ReservedKind | SymbolKind | OtherKind,
  expected: string[],
  column: number,
  line: number,
  reason?: string
}

interface IError<A> {
  error: true,
  result: A
}

interface ISuccess<A> {
  error: false,
  result: A
}

interface NumberInfo {
  value: number,
  type: ValueKind.Integer | ValueKind.Real
}

/**
 * Funcion que intenta capturar un token numerico
 * @param {TokenQueue} source Fuente en la que hay que buscar el numero
 */
export function Number(source : TokenQueue) : IError<PatternError> | ISuccess<NumberInfo> {
  let current = source.current()

  if (current.kind == ValueKind.Real || current.kind == ValueKind.Integer) {
    source.next()
    // A esta altura ya se que current representa un Token de tipo NumberToken, por lo tanto
    // su propiedad value es de tipo number y no (number | string), por lo tanto la casteo
    // a tipo number para que el compilador no se queje 
    return {error:false, result:{value:current.value as number, type:current.kind}}
  }
  else {
    let unexpected  = current.kind
    let expected    = ['entero', 'real']
    let column      = current.column
    let line        = current.line

    return {error:true, result:{unexpected, expected, column, line}}
  }
}

/**
 * Captura un token de tipo 'entero'
 * @param {TokenQueue} source fuente desde la cual se debe capturar
 */
export function Integer(source: TokenQueue) : IError<PatternError> | ISuccess<number> {
  const current = source.current()

  if (current.kind === ValueKind.Integer) {
    // consumir el token actual y...
    source.next()
    // ...devolver los datos importantes o...
    return {error:false, result:current.value as number}
  }
  else {
    // ...devolver informacion sobre el error
    const unexpected = current.kind
    const expected = ['entero']
    const column = current.column
    const line = current.line

    return {error:true, result:{unexpected, expected, column, line}}
  }
}

/**
 * Captura la dimension de un arreglo
 */
export function ArrayDimension(source: TokenQueue) : IError<PatternError> | ISuccess<number[]> {
  let indexes : number[] = []

  let index_report = Integer(source)

  if (index_report.error) {
    return index_report
  }
  else {
    indexes.push(index_report.result as number)
  }

  if (source.current().kind === SymbolKind.Comma) {
    source.next()

    let following_indexes = ArrayDimension(source)

    if (following_indexes.error) {
      return following_indexes
    }
    else {
      indexes = indexes.concat(following_indexes.result as number[])
      return {error:false, result:indexes}
    }
  }
  else {
    return {error:false, result:indexes}
  }
}

export function Word (source: TokenQueue) : IError<PatternError> | ISuccess<string> {
  let current = source.current()

  if (current.kind === OtherKind.Word) {
    source.next()
    return {error:false, result:current.text}
  }
  else {
    let unexpected = current.kind
    let expected = ['word']
    let column = current.column
    let line = current.line

    return {error:true, result:{unexpected, expected, column, line}}
  }
}

/**
 * Crea un patron que busca un token de tipo "kind".
 * Esta funcion no es un patron, si no que devuelve una funcion que lo es.
 */
export function Kind <A> (kind : A) : (source:TokenQueue)=>IError<PatternError>|ISuccess<A> {
  function KindMatcher (source : TokenQueue) : IError<PatternError> | ISuccess<A> {
    let expected_kind : A = kind
    if (source.current().kind == expected_kind) {
      source.next()
      return {error:false, result:expected_kind}
    }
    else {
      return {error:true, result:{reason:"unexpected-token", expected:expected_kind, unexpected:source.current().kind}}
    }
  }
  return KindMatcher
}

interface IDeclarationInfo {
  name: string
  is_array: boolean
  dimensions: number[] 
}

/**
 * Patron que consume la declaracion de una variable (nombre y dimension)
 */
export function VariableDeclaration (source: TokenQueue) : IError<PatternError> | ISuccess<IDeclarationInfo> {

  const variable : IDeclarationInfo = {name: '', is_array  : false, dimensions: []}

  let text = Word(source)

  if (text.error) {
    return text
  }
  else {
    variable.name = text.result as string
    if (source.current().kind === SymbolKind.LeftBracket) {
      source.next()
      const dimension = ArrayDimension(source)
      if (dimension.error) {
        return dimension
      }
      else {
        variable.is_array = true
        variable.dimensions = dimension.result as number[]
        if (source.current().kind === SymbolKind.RightBracket) {
          source.next()
          return {error:false, result:variable}
        }
        else {
          const current     = source.current()
          const unexpected  = current.kind
          const expected    = ['right-bracket']
          const column      = current.column
          const line        = current.line

          return {error:true, result:{unexpected, expected, column, line}}
        }
      }
    }
    else {
      return {error:false, result:variable}
    }
  }
}

/**
 * Patron que consume una lista de declaraciones
 */
export function VariableList (source: TokenQueue) : IError<PatternError> | ISuccess<IDeclarationInfo[]> {
  const variables : IDeclarationInfo[] = []

  let partial_match = false

  const name_report = VariableDeclaration(source)

  if (name_report.error) {
    return name_report
  }
  else {
    variables.push(name_report.result as IDeclarationInfo)

    if (source.current().kind === SymbolKind.Comma && source.peek().kind === OtherKind.Word) {
      source.next()
      
      const var_list_match = VariableList(source)

      if (var_list_match.error) {
        return var_list_match
      }
      else if (var_list_match.error == false) {
        const k = var_list_match.result
        const result = variables.concat(var_list_match.result)  
        return {error:false, result}
      }
    }
    else {
      return {error:false, result:variables}
    }
  }
}

let isType = (k: TokenKind) => {
  return k == ReservedKind.Entero || k == ReservedKind.Real || k == ReservedKind.Logico || k == ReservedKind.Caracter 
}

type TypeNameString = 'entero' | 'real' | 'logico' | 'caracter' 

/**
 * Patron que consume un tipo de datos.
 */
export function TypeName (source: TokenQueue) : IError<PatternError> | ISuccess<TypeNameString> {
  const current = source.current()

  if ( isType(current.kind) ) {
    source.next()
    return {error:false, result:current.name as TypeNameString}
  }
  else {
    const unexpected  = current.kind
    const expected    = ['entero', 'real', 'logico', 'caracter']
    const column      = current.column
    const line        = current.line
    const reason      = 'nonexistent-type'

    return {error:true, result:{unexpected, expected, column, line, reason}}
  }
}

/**
 * Patron que consume un indice (una expresion) de un arreglo
 */
export function IndexExpression (source: TokenQueue) : IError<PatternError> | ISuccess<IExpElement[][]> {
  let indexes: IExpElement[][] = []

  const index_report = Expression(source)

  if (index_report.error === true) {
    return index_report
  }
  else {
    indexes.push(index_report.result)

    if (source.current().kind === SymbolKind.Comma) {
      source.next()

      const another_index_report = IndexExpression(source)

      if (another_index_report.error === true) {
        return another_index_report
      }
      else {
        indexes = [...indexes, ...another_index_report.result]

        return {error:false, result:indexes}
      }
    }
    else {
      return {error:false, result:indexes}
    }
  }
}

interface IInvocationInfo {
  name: string
  is_array: boolean
  indexes: IExpElement[][]
}

/**
 * Captura la invocacion de una variable
 */
export function Variable (source: TokenQueue) : IError<PatternError> | ISuccess<IInvocationInfo> {
  let name = '', is_array = false, indexes: IExpElement[][] = []

  let word_match = Word(source)

  if (word_match.error === true) {
    return word_match
  }
  else {
    name = word_match.result

    if (source.current().kind === SymbolKind.LeftPar) {
      source.next()

      let index_expressions_match = IndexExpression(source)

      if (index_expressions_match.error === true) {
        return index_expressions_match
      }

      is_array = true
      indexes = index_expressions_match.result

      if (source.current().kind === SymbolKind.RightPar) {
        source.next()

        return {error:false, result:{name, is_array, indexes}}
      }
      else {
        const current = source.current()

        const unexpected  = current.kind
        const expected    = ['right-bracket']
        const column      = current.column
        const line        = current.line

        return {error:true, result:{unexpected, expected, column, line}}
      }
    }
    else {
      return {error:false, result:{name, is_array, indexes}}
    }
  }
}

let precedence : {[p: string]: number} = {
  'power'       : 6 ,
  'div'         : 5 ,
  'mod'         : 5 ,
  'times'       : 5 ,
  'divide'      : 5 ,
  'minus'       : 4 ,
  'plus'        : 4 ,
  'minor-than'  : 3 ,
  'minor-equal' : 3 ,
  'major-than'  : 3 ,
  'major-equal' : 3 ,
  'equal'       : 2 ,
  'diff-than'   : 2 ,
  'and'         : 1 ,
  'or'          : 0
}

function is_operator (k: TokenKind) {
  switch (k) {
    case SymbolKind.Power:
    case SymbolKind.Times:
    case SymbolKind.Slash:
    case SymbolKind.Minus:
    case SymbolKind.Plus:
    case SymbolKind.Minor:
    case SymbolKind.Major:
    case SymbolKind.MinorEq:
    case SymbolKind.MajorEq:
    case SymbolKind.Equal:
    case SymbolKind.Different:
    case ReservedKind.Div:
    case ReservedKind.Mod:
    case ReservedKind.And:
    case ReservedKind.Or:
      return true
    default:
      return false
  }
}

/**
 * Representa un elemento de una expresion
 */
interface IExpElement {
  type: 'invocation' | 'literal' | 'operator' | 'parenthesis' | 'call'
  name?: string
}

/**
 * Captura una expresion
 */
export function Expression (source: TokenQueue) : IError<PatternError> | ISuccess<IExpElement[]> {
  // Ubicacion del inicio de la expresion, en caso de que haya algun error
  const column = source.current().column
  const line = source.current().line

  /**
   * Dice si un token indica el fin de la expresion a capturar
   */
  const end_reached = (tkind: TokenKind) => {
    return  tkind == SymbolKind.EOL
            || tkind == SymbolKind.EOF
            || tkind == SymbolKind.Comma
            || tkind == SymbolKind.RightPar
            || tkind == SymbolKind.RightBracket
  }

  const output: IExpElement[] = []
  const operators: IExpElement[] = []

  while (!end_reached(source.current().kind)) {
    const ctoken = source.current()

    if (ctoken.kind == SymbolKind.LeftPar) {
      operators.unshift({type:'parenthesis', name:'left-par'})
      source.next()
    }
    else if (ctoken.kind == SymbolKind.RightPar) {
      while (operators.length > 0 && operators[0].name != 'left-par') {
        output.push(operators.shift())
      }
      if (operators[operators.length - 1].name == 'left-par') {
        operators.shift()
      }
      else {
        const unexpected = SymbolKind.LeftPar;
        const expected = ['left-par']
        const reason = 'mismatched-parenthesis'
        return {error:true, result:{unexpected, expected, reason, column, line}};
      }
    }
    else if (is_operator(ctoken.kind)) {
      const p1 = precedence[ctoken.kind]
      const p2 = () => precedence[operators[0].name]

      while (operators.length > 0 &&  p1 <= p2()) {
        const op = operators.shift()

        output.push({type:'operator', name:op.name})
      }

      operators.unshift({type:'operator', name:ctoken.name})

      source.next()
    }
    else {
      const value_match = Value(source)

      if (value_match.error == true) {
        return value_match
      }
      
      output.push(value_match.result)
    }
  }

  while (operators.length > 0) output.push(operators.shift());

  return {error:false, result:output}
}

interface ILiteralValue {
  type: 'literal'
  value: boolean | string | number
}

interface IInvocationValue {
  type: 'invocation'
  name: string
  is_array: boolean
  indexes: IExpElement[][]
}

type ExpValue = ILiteralValue  | IInvocationValue | IModuleCall

/**
 * Patron que captura un valor (literal o invocado)
 */
export function Value (source: TokenQueue) : IError<PatternError> | ISuccess<ExpValue> {
  let ctoken = source.current()

  if (ctoken.kind == OtherKind.Word) {
    if (source.peek().kind == SymbolKind.LeftPar) {
      const call_match = ModuleCall(source)

      return call_match
    }
    else {
      let value_match = Variable(source)

      if (value_match.error == true) {
         return value_match
      }
      else if (value_match.error == false) {
        
        const result: IInvocationValue = {
          type: 'invocation',
          name: value_match.result.name,
          is_array: value_match.result.is_array,
          indexes: value_match.result.indexes
        }

        return {error:false, result}
      }
    }
  }
  else if (isLiteralTokenType(ctoken.kind)) {
    let value: number | boolean | string

    if (ctoken.kind == ReservedKind.Verdadero || ctoken.kind == ReservedKind.Falso)
      value = ctoken.kind == ReservedKind.Verdadero
    else
      value = ctoken.value

    source.next()

    return {error:false, result:{type:'literal', value}}
  }
  else {
    const unexpected  = ctoken.kind
    const expected    = ['expresion']
    const reason      = '@value-expected-expression' 
    const column      = ctoken.column
    const line        = ctoken.line
    return {error:true, result:{unexpected, expected, reason, column, line}}
  }
}

function isLiteralTokenType (k: TokenKind) {
  let is_num = k == ReservedKind.Entero || k == ReservedKind.Real
  let is_bool = k == ReservedKind.Verdadero || k == ReservedKind.Falso
  let is_other = k == ReservedKind.Caracter || k == ValueKind.String
  return is_num || is_bool || is_other
}

/**
 * Captura una lista de argumentos, es decir, una lista de expresiones 
 */
export function ArgumentList (source: TokenQueue) : IError<PatternError> | ISuccess<IExpElement[][]>{
  let args: IExpElement[][] = []
  const exp = Expression(source)

  if (exp.error) {
    return exp
  }
  else if (exp.error == false) {
    args.push(exp.result)

    if (source.current().kind == SymbolKind.Comma) {
      source.next()
      const next_args = ArgumentList(source)
      if (next_args.error) {
        return next_args
      }
      else {
        args = args.concat(next_args.result as IExpElement[][])
        return {error:false, result:args}
      }
    }
    else {
      return {error:false, result:args}
    }
  }
}

/**
 * Captura una lista de parametros en la declaracion de una funcion o procedimiento
 */
export function ParameterList (source: TokenQueue) : IError<PatternError> | ISuccess<IParameter[]> {
  let result: IParameter[] = []

  let parameter_report = Parameter(source)

  if (parameter_report.error) {
    return parameter_report
  }
  else {
    result.push(parameter_report.result as IParameter)

    if (source.current().kind == SymbolKind.Comma) {
      source.next()

      let other_parameters = ParameterList(source)

      if (other_parameters.error) {
        return other_parameters
      }
      else {
        result = result.concat(other_parameters.result as IParameter[])

        return {error:false, result}
      }
    }
    else {
      return {error:false, result}
    }
  }
}

interface IParameter {
  name: string
  by_ref: boolean
  type: TypeNameString
}

/**
 * Captura un parametro de una funcion o procedimiento
 */
export function Parameter (source: TokenQueue) : IError<PatternError> | ISuccess<IParameter> {
  const result: IParameter = {name: '', by_ref: false, type: null}

  let type_r = TypeName(source)

  if (type_r.error) {
    return type_r
  }
  else {
    result.type = type_r.result as TypeNameString

    if (source.current().kind === ReservedKind.Ref) {
      result.by_ref = true
      source.next() // consumir 'ref'
    }

    let name = Word(source)

    if (name.error) {
      return name
    }
    else {
      result.name = name.result as string
    }

    return {error:false, result}
  }


}

interface IModuleCall {
  type: 'call'
  args: IExpElement[][]
  name: string
}

/**
 * Captura una llamada a una funcion o procedimiento
 */
export function ModuleCall (source: TokenQueue) : IError<PatternError> | ISuccess<IModuleCall> {
  const name = Word(source)

  if (name.error) {
    return name
  }
  else if (name.error == false) {
    if (source.current().kind != SymbolKind.LeftPar) {
      const current     = source.current()
      const unexpected  = current.kind
      const expected    = ['right-par']
      const column      = current.column
      const line        = current.line

      return {error:true, result:{unexpected, expected, column, line}}
    }
    else {
      source.next()
    }

    if (source.current().kind != SymbolKind.RightPar) {

      let args = ArgumentList(source)

      if (args.error) {
        return args
      }
      else if (args.error == false) {

        if (source.current().kind == SymbolKind.RightPar) {
          source.next()
          return {error:false, result:{type:'call', args:args.result, name:name.result}}
        }
        else {
          const current = source.current()
          const unexpected  = current.kind
          const expected    = ['right-par']
          const column      = current.column
          const line        = current.line

          return {error:true, result:{unexpected, expected, column, line}}
        }
      }
    }
    else {
      source.next() 
      return {error:false, result:{type:'call', args:[], name:name.result}}
    }
  }
}

type Statement = IModuleCall | IAssignment | IIf | IWhile | IFor | IUntil | IReturn | IDeclarationStatement

interface IAssignment {
  type: 'assignment'
  left: IInvocationInfo
  right: IExpElement[]
}

/**
 * Captura un enunciado de asignacion
 */
export function Assignment (source: TokenQueue) : IError<PatternError> | ISuccess<IAssignment> {
  const result: IAssignment = {type: 'assignment', left: null, right: null}

  const left_hand_match = Variable(source)

  if (left_hand_match.error) {
    return left_hand_match
  }
  else {
    result.left = left_hand_match.result as IInvocationInfo

    if (source.current().kind !== SymbolKind.Assignment) {
      const current = source.current()
      const unexpected = current.kind
      const expected = ['<-']
      const line = current.line
      const column = current.column
      const reason = 'bad-assignment-operator'
      return {error:true, result:{unexpected, expected, line, column, reason}}
    }
    else {
      source.next()
    }

    const right_hand_match = Expression(source)

    if (right_hand_match.error) {
      return right_hand_match
    }
    else {
      result.right = right_hand_match.result as IExpElement[]

      return {error:false, result}
    }
  }
}

interface IIf {
  type: 'if'
  condition: IExpElement[]
  true_branch: Statement[]
  false_branch: Statement[]
}
/**
 * Captura un enunciado si
 */
export function If (source: TokenQueue) : IError<PatternError> | ISuccess<IIf> {
  let result: IIf = {
    type : 'if',
    condition : null,
    true_branch : [],
    false_branch :[]
  }

  if (source.current().kind === ReservedKind.Si) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ['si']
    let line = current.line
    let column = current.column
    let reason = 'missing-si'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === SymbolKind.LeftPar) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ['(']
    let line = current.line
    let column = current.column
    let reason = 'missing-par-at-condition'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  const queue: Token[] = []
  while ( /right\-par|eof|eol/.test(source.current().name) === false ) {
    queue.push(source.current())
    source.next()
  }

  const expression_match = Expression(new TokenQueue(queue))

  if (expression_match.error) {
    return expression_match
  }
  else {
    result.condition = expression_match.result as IExpElement[]
  }

  if (source.current().kind === SymbolKind.RightPar) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = [')']
    let line = current.line
    let column = current.column
    let reason = 'missing-par-at-condition'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === ReservedKind.Entonces) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ['entonces']
    let line = current.line
    let column = current.column
    let reason = 'missing-entonces'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  skipWhiteSpace(source)

  while ( /finsi|sino|eof/.test(source.current().name) === false ) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match
    }

    result.true_branch.push(statement_match.result as Statement)

    skipWhiteSpace(source)
  }

  if (source.current().kind === ReservedKind.Sino) {
    source.next()

    skipWhiteSpace(source)

    while ( /finsi|eof/.test(source.current().name) === false ) {
      let statement_match = Statement(source)

      if (statement_match.error) {
        return statement_match
      }

      result.false_branch.push(statement_match.result as Statement)

      skipWhiteSpace(source)
    }
  }

  if (source.current().kind === ReservedKind.FinSi) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ['finsi']
    let line = current.line
    let column = current.column
    let reason = 'missing-finsi'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === SymbolKind.EOL) {
    source.next()
  }

  return {error:false, result}
}

interface IWhile {
  type: 'while'
  condition: IExpElement[]
  body: Statement[]
}

export function While (source: TokenQueue) : IError<PatternError> | ISuccess<IWhile> {
  const result: IWhile = {
    type : 'while',
    condition : null,
    body : []
  }

  if (source.current().kind === ReservedKind.Mientras) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['mientras']
    const line = current.line
    const column = current.column
    const reason = 'missing-mientras'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === SymbolKind.LeftPar) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['(']
    const line = current.line
    const column = current.column
    const reason = 'missing-par-at-condition'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  const queue: Token[] = []
  while ( /right\-par|eof|eol/.test(source.current().name) === false ) {
    queue.push(source.current())
    source.next()
  }

  const expression_match = Expression(new TokenQueue(queue))

  if (expression_match.error) {
    return expression_match
  }
  else {
    result.condition = expression_match.result as IExpElement[]
  }

  if (source.current().kind === SymbolKind.RightPar) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = [')']
    const line = current.line
    const column = current.column
    const reason = 'missing-par-at-condition'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  skipWhiteSpace(source)

  while ( /finmientras|eof/.test(source.current().name) === false ) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match
    }

    result.body.push(statement_match.result as Statement)

    skipWhiteSpace(source)
  }

  if (source.current().kind === ReservedKind.FinMientras) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['finmientras']
    const line = current.line
    const column = current.column
    const reason = 'missing-finmientras'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === SymbolKind.EOL) {
    source.next()
  }

  return {error:false, result}
}


// para i <- 0 hasta 5
//  ...
// finpara
//
// 'para' <expresion> 'hasta' <expresion.entera>
//    [<enunciado>]
// 'finpara'
interface IFor {
  type: 'for'
  counter_init: IAssignment
  last_value: IExpElement[]
  body: Statement[]
}

export function For(source: TokenQueue) : IError<PatternError> | ISuccess<IFor> {
  const result: IFor = {
    type: 'for',
    counter_init: null,
    last_value: null,
    body: []
  }

  if (source.current().kind === ReservedKind.Para) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['para']
    const line = current.line
    const column = current.column
    const reason = 'missing-para'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  const queue: Token[] = []
  while (source.current().kind !== ReservedKind.Hasta) {
    queue.push(source.current())
    source.next()
  }

  const init_statement = Assignment(new TokenQueue(queue))

  if (init_statement.error) {
    return init_statement
  }
  else {
    result.counter_init = init_statement.result as IAssignment

    if (source.current().kind === ReservedKind.Hasta) {
      source.next()
    }
    else {
      let current = source.current()
      let unexpected = current.kind
      let expected = ['hasta']
      let line = current.line
      let column = current.column
      let reason = 'missing-hasta'
      return {error:true, result:{unexpected, expected, line, column, reason}}
    }

    const last_val_exp = Expression(source)

    if (last_val_exp.error) {
      return last_val_exp
    }
    else {
      result.last_value = last_val_exp.result as IExpElement[]

      skipWhiteSpace(source)

      while ( /finpara|eof/.test(source.current().name) === false ) {
        let statement_match = Statement(source)

        if (statement_match.error) {
          return statement_match
        }

        result.body.push(statement_match.result as Statement)

        skipWhiteSpace(source)
      }

      if (source.current().kind === ReservedKind.FinPara) {
        source.next()
      }
      else {
        let current = source.current()
        let unexpected = current.kind
        let expected = ['finpara']
        let line = current.line
        let column = current.column
        let reason = 'missing-finpara'
        return {error:true, result:{unexpected, expected, line, column, reason}}
      }

      skipWhiteSpace(source)

      return {error:false, result}
    }
  }
}

interface IUntil {
  type: 'until'
  condition: IExpElement[]
  body: Statement[]
}

export function Until (source: TokenQueue) : IError<PatternError> | ISuccess<IUntil> {
  const result: IUntil = {
    type : 'until',
    condition : null,
    body : []
  }

  if (source.current().kind === ReservedKind.Repetir) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ['repetir']
    let line = current.line
    let column = current.column
    let reason = 'missing-repetir'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  skipWhiteSpace(source)

  // TODO: hacer que "hasta que" sea un solo token ("hastaque")
  while ( /hasta|que|eof/.test(source.current().name) === false ) {
    let statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match
    }
    else {
      if (statement_match.result !== null) {
        result.body.push(statement_match.result as Statement)
      }

      skipWhiteSpace(source)
    }
  }

  if (source.current().kind === ReservedKind.Hasta) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['hasta']
    const line = current.line
    const column = current.column
    const reason = 'missing-hasta'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === ReservedKind.Que) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['que']
    const line = current.line
    const column = current.column
    const reason = 'missing-que'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === SymbolKind.LeftPar) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['(']
    const line = current.line
    const column = current.column
    const reason = 'missing-par-at-condition'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  const queue: Token[] = []
  while ( /right\-par|eof|eol/.test(source.current().name) === false ) {
    queue.push(source.current())
    source.next()
  }

  const expression_match = Expression(new TokenQueue(queue))

  if (expression_match.error) {
    return expression_match
  }
  else {
    result.condition = expression_match.result as IExpElement[]

    if (source.current().kind === SymbolKind.RightPar) {
      source.next()
    }
    else {
      const current = source.current()
      const unexpected = current.kind
      const expected = [')']
      const line = current.line
      const column = current.column
      const reason = 'missing-par-at-condition'
      return {error:true, result:{unexpected, expected, line, column, reason}}
    }

    if (source.current().kind === SymbolKind.EOL) {
      source.next()
    }

    return {error:false, result}
  }
}

interface IReturn {
  type: 'return'
  expression: IExpElement[]
}
export function Return (source: TokenQueue) : IError<PatternError> | ISuccess<IReturn> {
  const result: IReturn = {
    type:'return',
    expression:null
  }

  if (source.current().kind != ReservedKind.Retornar) {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['retornar']
    const line = current.line
    const column = current.column
    const reason = 'missing-retornar'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }
  else {
    source.next() // consumir 'retornar'

    const exp = Expression(source)

    if (exp.error) {
      return exp
    }
    else {
      result.expression = exp.result as IExpElement[]

      return {error:false, result}
    }
  }
}

export function Statement (source: TokenQueue) : IError<PatternError> | ISuccess<Statement> {
  switch (source.current().kind) {
    case OtherKind.Word:
      if (source.peek().kind === SymbolKind.LeftPar) {
        return ModuleCall(source)
      }
      else {
        return Assignment(source)
      }
    case ReservedKind.Si:
      return If(source)
    case ReservedKind.Mientras:
      return While(source)
    case ReservedKind.Repetir:
      return Until(source)
    case ReservedKind.Para:
      return For(source)
    case ReservedKind.Retornar:
      return Return(source)
    default: {
      const current = source.current()
      const reason = 'missing-statement'
      const unexpected = current.kind
      const expected = ['variable', 'funcion', 'procedimiento', 'si', 'mientras', 'repetir']
      const line = current.line
      const column = current.column
      return {error:true, result:{unexpected, expected, line, column, reason}}
    }
  }
}

interface IMainModule {
  type: 'module'
  name: 'main'
  module_type: 'main'
  body: Statement[]
}

export function MainModule (source: TokenQueue) : IError<PatternError> | ISuccess<IMainModule> {
  const result: IMainModule = {
    type:'module',
    name:'main',
    module_type:'main',
    body:[]
  }

  if (source.current().kind === ReservedKind.Variables) {
    source.next()
  }
  else {
    const current = source.current()
    const unexpected = current.kind
    const expected = ['variables']
    const line = current.line
    const column = current.column
    const reason = 'missing-variables'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  skipWhiteSpace(source)

  while (/inicio|eof/.test(source.current().name) === false) {
    const var_declaration_match = DeclarationStatement(source)

    if (var_declaration_match.error) {
      return var_declaration_match
    }
    else {
      result.body.push(var_declaration_match.result as IDeclarationStatement)
    }

    skipWhiteSpace(source)
  }

  if (source.current().kind === ReservedKind.Inicio) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ['inicio']
    let line = current.line
    let column = current.column
    let reason = 'missing-inicio'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  skipWhiteSpace(source)

  while (/fin|eof/.test(source.current().name) === false) {
    const statement_match = Statement(source)

    if (statement_match.error) {
      return statement_match
    }
    else {
      result.body.push(statement_match.result as Statement)
    }

    skipWhiteSpace(source)
  }

  if (source.current().kind === ReservedKind.Fin) {
    source.next()
  }
  else {
    let current = source.current()
    let unexpected = current.kind
    let expected = ['fin']
    let line = current.line
    let column = current.column
    let reason = 'missing-fin'
    return {error:true, result:{unexpected, expected, line, column, reason}}
  }

  if (source.current().kind === SymbolKind.EOL) {
    source.next()
  }

  return {error:false, result}
}

export function FunctionModule (source) {
  let header = concat([TypeName, Kind('funcion'), Word, Kind(SymbolKind.LeftPar), ParameterList, Kind('right-par')])

  let h_report = header(source)

  if (h_report.error) return h_report;

  let header_tokens = h_report.result.filter(t => (typeof t == 'string' && (t == 'funcion' || t == SymbolKind.LeftPar || t == 'right-par') ? false:true))

  const header_data = {
    return_type: header_tokens[0],
    name: header_tokens[1],
    parameters: header_tokens[2]  
  }

  let result = header_data

  skipWhiteSpace(source)

  let variable_declarations = until(concat([DeclarationStatement, skipWhiteSpace]), tk => tk == 'inicio')

  let d_report = variable_declarations(source)

  if (source.current().kind != 'inicio') return UnexpectedTokenReport(source.current(), 'inicio', 'missing-inicio')

  source.next() // consumir inicio

  if (d_report.error) return d_report;

  let declarations = d_report.result.reduce(flatten, []).filter(tk => tk == undefined ? false:true)

  result.body = [...declarations]

  skipWhiteSpace(source)

  let statements = until(concat([Statement, skipWhiteSpace]), tk => tk == 'finfuncion')

  let s_report = match(statements).from(source)

  if (s_report.error) return s_report;

  let statement_objs = s_report.result.reduce(flatten, []).filter(tk => tk == undefined ? false:true)

  result.body = [...result.body, ...statement_objs]

  if (source.current().kind != 'finfuncion') return UnexpectedTokenReport(source.current(), 'finfuncion', 'missing-finfuncion')

  source.next() // consumir 'finfuncion'

  result.type = 'module'

  result.module_type = 'function'

  return {error:false, result}
}

export function ProcedureModule (source) {
  let header = concat([Kind('procedimiento'), Word, Kind(SymbolKind.LeftPar), ParameterList, Kind('right-par')])

  let h_report = header(source)

  if (h_report.error) return h_report;

  let header_tokens = h_report.result.filter(t => (typeof t == 'string' && (t == 'procedimiento' || t == SymbolKind.LeftPar || t == 'right-par') ? false:true))

  const header_data = {
    return_type: header_tokens[0],
    name: header_tokens[1],
    parameters: header_tokens[2]  
  }

  let result = header_data

  skipWhiteSpace(source)

  let variable_declarations = until(concat([DeclarationStatement, skipWhiteSpace]), tk => tk == 'inicio')

  let d_report = variable_declarations(source)

  if (source.current().kind != 'inicio') return UnexpectedTokenReport(source.current(), 'inicio', 'missing-inicio')

  source.next() // consumir inicio

  if (d_report.error) return d_report;

  let declarations = d_report.result.reduce(flatten, []).filter(tk => tk == undefined ? false:true)

  result.body = [...declarations]

  skipWhiteSpace(source)

  let statements = until(concat([Statement, skipWhiteSpace]), tk => tk == 'finprocedimiento')

  let s_report = match(statements).from(source)

  if (s_report.error) return s_report;

  let statement_objs = s_report.result.reduce(flatten, []).filter(tk => tk == undefined ? false:true)

  result.body = [...result.body, ...statement_objs]

  if (source.current().kind != 'finprocedimiento') return UnexpectedTokenReport(source.current(), 'finprocedimiento', 'missing-finprocedimiento')

  source.next() // consumir 'finprocedimiento'

  result.type = 'module'

  result.module_type = 'procedure'

  return {error:false, result}
}

interface ITypedDeclaration extends IDeclarationInfo {
  datatype: string
}

interface IDeclarationStatement {
  type: 'declaration'
  variables: ITypedDeclaration[]
}

export function DeclarationStatement (source: TokenQueue) : IError<PatternError> | ISuccess<IDeclarationStatement> {
  const result: IDeclarationStatement = {
    type:'declaration',
    variables: []
  }

  const type_match = TypeName(source)
  let current_type: TypeNameString = null

  if (type_match.error) {
    return type_match
  }
  else {
    current_type = type_match.result as TypeNameString
  }

  const variables_match = VariableList(source)

  if (variables_match.error) {
    return variables_match
  }
  else {
    for (let variable of (variables_match.result as IDeclarationInfo[])) {
      const declaration = {
        datatype: current_type,
        name: variable.name,
        is_array: variable.is_array,
        dimensions: variable.dimensions
      }

      result.variables.push(declaration)
    }
  }

  let eol_found = false
  let comma_found = false

  switch (source.current().kind) {
    case SymbolKind.Comma:
      comma_found = true
      break
    case SymbolKind.EOL:
      eol_found = true
      break
    default:
      return {
        error:true,
        result:{
          unexpected:source .current().kind,
          expected: ['eol', 'comma'],
          column: source.current().column,
          line: source.current().line,
          reason: '@declaration-unexpected-token' 
      }
    }
  }

  source.next()

  if (comma_found) {
    const next_declaration_match = DeclarationStatement(source)

    if (next_declaration_match.error) {
      return next_declaration_match
    }
    else {
      result.variables = result.variables.concat((next_declaration_match.result as IDeclarationStatement).variables)
      return {error:false, result}
    }
  }

  if (eol_found) {
    return {error:false, result}
  }
}

export function skipWhiteSpace (source: TokenQueue) {
  let current = source.current()
  while (current.kind === SymbolKind.EOL) {
    current = source.next()
  }

  // HACK: Esto permite que skipWhiteSpace se comporte como un patron...
  return {error:false}
}

function UnexpectedTokenReport(current_token: Token, expected:  string[], reason: string) {
  const result: PatternError = {
    unexpected: current_token.kind,
    line: current_token.line,
    column: current_token.column,
    expected: expected
  }

  result.reason = reason

  return new Report(true, result)
}

/**
 * Funcion que, dada una funcion de captura y una fuente devuelve un reporte
 * @param {Function} pattern_matcher Funcion que captura tokens
 */
export function match(pattern_matcher) {
  return {
    from: (source) => {
      return pattern_matcher(source)
    }
  }
}

// concat es una funcion que toma una lista de "patrones" y produce uno nuevo.
// El patron que produce concat falla cuando el primero de sus componentes lo hace
// y devuelve el reporte de dicha falla. Si ninguno de los patrones componentes
// produce un error, se devuelve una lista de los resultados

// match(concat([TypeName, "funcion", Word, ParameterList])).from(source).to([
// 'return_type',
// '_',
// 'name',
// 'parameter_list'
// ])

export function concat (func_list) {

  function new_pattern (source) {
    let functions = func_list
    let result = []
    for (let f of functions) {
      let report = f(source)
      if (report.error) {
        return report
      }
      else {
        result.push(report.result)
      }
    }
    return {error:false, result}
  }

  return new_pattern
}

export function until (pattern, predicate) {
  function new_pattern (source) {
    let result = []

    let current_kind = source.current().kind

    while (current_kind != 'eof' && !predicate(current_kind)) {
      let report = pattern(source)

      if (report.error) return report;
      else result.push(report.result);

      current_kind = source.current().kind
    }

    return {error:false, result}
  }

  return new_pattern
}
