'use strict'

var RAND_MAXIMO = 20

function enteroEntre(a, b) {
  return Math.floor(Math.random()*b) + a
}

function Palabra () {
  var palabras = [
      'maximo'
    , 'repeticiones'
    , 'potencia'
    , 'raizCuadrada'
    , 'fibo'
    , 'i'
    , 'total'
    , 'acumulador'
    , 'suma'
  ]

  return palabras[enteroEntre(0, palabras.length-1)]
}

function Entero () {
  return enteroEntre(0, RAND_MAXIMO).toString()
}

function Real () {
  return (Math.random()*RAND_MAXIMO).toFixed(2).toString()
}

function Tipo () {
  let n = Math.random()

  if (n <= 0.25)
    return 'entero'
  else if (n <= 0.5)
    return 'logico'
  else if (n <= 0.75)
    return 'caracter'
  else
    return 'real'
}

function Dimension () {
  if (Math.random() >= 0.5) {
    return Entero()
  }
  else {
    return Entero() + ', ' + Dimension()
  }
}

function Identificador () {
  if (Math.random() >= 0.5) {
    return Palabra()
  }
  else {
    return Palabra() + '[' + Dimension() + ']'
  }
}

function ListaDeIdentificadores () {
  if (Math.random() >= 0.5)
    return Identificador()
  else
    return Identificador() + ', ' + ListaDeIdentificadores()
}

function DeclaracionDeIdentificadores () {
  let n = Math.random()

  if (n <= 0.3)
    return Tipo() + ' ' + ListaDeIdentificadores() + '\n'
  else if (n <= 0.6)
    return Tipo() + ' ' + ListaDeIdentificadores() + '\n' + DeclaracionDeIdentificadores()
  else
    return Tipo() + ' ' + ListaDeIdentificadores() + ', ' + DeclaracionDeIdentificadores()
}

function Expresion () {
  let n = Math.random()

  if (n <= 0.25)
    return Termino()
  else if (n <= 0.5)
    return Signo() + Termino()
  else if (n <= 0.75)
    return Termino() + ' ' + Signo() + ' ' + ListaDeTerminos()
  else
    return Signo() + Termino() + ' ' + Signo() + ' ' + ListaDeTerminos()
}

function Termino () {
  let n = Math.random()

  if (n <= 0.5)
    return Factor()
  else
    return Factor() + ' ' + OperadorBinario() + ' ' + Termino()
}

function OperadorBinario () {
  if (Math.random() <= 0.5)
    return OperadorMatematico()
  else
    return OperadorRelacional()
}

function OperadorMatematico () {
  let operadores = [
      '*'
    , '/'
    , 'div'
    , 'mod'
  ]

  return operadores[enteroEntre(0, operadores.length - 1)]
}

function OperadorRelacional () {
  let op = [
      '<'
    , '>'
    , '<>'
    , '<='
    , '>='
  ]

  return op[enteroEntre(0, op.length - 1)]
}

function ListaDeTerminos () {
  if (Math.random() <= 0.5)
    return Termino()
  else
    return Termino() + ' ' + Signo() + ' ' + ListaDeTerminos()
}

function Signo () {
  if (Math.random() <= 0.5)
    return '+'
  else
    return '-'
}

function Factor () {
  let n = Math.random()

  if (n <= 0.3)
    return ConstanteNumerica()
  else if (n <= 0.6)
    return Invocacion()
  else
    return '(' + 'EXP' + ')'
}

function ConstanteNumerica () {
  if (Math.random() <= 0.5)
    return Entero()
  else
    return Real()
}

function Invocacion () {
  if (Math.random() <= 0.5)
    return Identificador()
  else
    return LlamadaAModulo()
}

function Asignacion () {
  return Identificador() + ' <- ' + Expresion()
}

function LlamadaAModulo () {
  if (Math.random() <= 0.5)
    return Palabra() + '()'
  else
    return Palabra() + '(' + ListaDeParametros() + ')'
}

function ListaDeParametros() {
  return 'EXP_UNO, EXP_DOS'
}

function ModuloPrincipal () {
  let n = Math.random()

  if (n <= 0.25)
    return 'variables\ninicio\nfin\n'
  else if (n <= 0.5)
    return 'variables\n' + DeclaracionDeIdentificadores() + 'inicio\n' + ListaDeEnunciados() + 'fin'
  else if (n <= 0.75)
    return 'variables\ninicio\n' + ListaDeEnunciados() + 'fin'
  else
    return 'variables\n' + DeclaracionDeIdentificadores() + 'inicio\nfin'
}

function Enunciado () {
  // TODO: Agregar el resto
  return Asignacion()
}

function ListaDeEnunciados () {
  return Enunciado() + '\n'
}

for (let i = 0; i < 2; i++) {
  console.log(ModuloPrincipal() + '\n')
}
