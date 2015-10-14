'use strict'

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
  return enteroEntre(0, 81).toString()
}

function Real () {
  return (Math.random()*81).toString()
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

function Expresion () {
  return 'EXPRESION_TEMPORAL + 2'
}

function Asignacion () {
  return Identificador() + ' <- ' + Expresion()
}

for (let i = 0; i < 6; i++) {
  console.log(Asignacion())
}
