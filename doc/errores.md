# Errores

Esta es una lista de los errores que el interprete puede encontrar y reportar
mientras intenta ejecutar un programa. Cada item es un error e indica su
nombre, que módulo los reporta y por qué, y sus atributos.

Todos los errores son objetos y tienen una propiedad llamada `reason`. Están
listados (mas o menos) en el orden en le que serian reportados.

## Reportados durante el analisis

- unexpected_char_at_float: emitido por el parser cuando se esta leyendo un numero con decimales y se encuentran caracteres distintos de numeros despues del punto decimal

[ESCRIBIR]

## Reportados por alguna transformacion

### Detectados en Typer.js

- @invocation-too-many-indexes: reportado cuando se invoca un arreglo con
  demasiados indices.

  - expected: cantidad maxima de indices que se esperaba recibir.

  - received: cantidad de indices recibidos.

- @undefined-variable: reportado cuando se utiliza una variable no declarada.

  - name: nombre de la variable.

### Detectados en Declarator.js

- repeated-variable: reportado cuando se declaran dos variables con el mismo
  nombre.

  - name: nombre repetido.

  - first: tipo con el que fue declarada la primer variable con dicho nombre.

  - second: tipo con el que fue declarada la variable repetida.

## Detectados en CallDecorator.js

- @call-undefined-module: reportado cuando se invoca un modulo no declarado.

  - name: nombre de dicho modulo.

## Reportados por el chequeador de tipos

Estos errores son detectados en TypeChecker.js

- @function-bad-return-type: Es reportado cuando el tipo de la expresion
  retornada por una funcion no coincide con el tipo de retorno declarado para
  esa funcion. Contiene:

  - expected: el tipo que se esperaba encontrar (el tipo que la funcion
    declaró que retornaba).

  - returned: el tipo que la funcion realmente retorna.

- assignment-error: reportado cuando se encuentra al menos un error en una
asignacion.

  - errors: arreglo con los errores encontrados.

- @assignment-incompatible-types: Es reportado cuando el tipo del valor que se
   quiere asignar a una variable no es compatible con el tipo de la variable.

  - expected: el tipo que se esperaba encontrar, es el tipo de la variable a
    la que se intentó asignar.

  - received: el tipo del valor que se intentó asignar.

- @call-errors-found: reportado cuando se encuentra al menos un error en una
llamada.

  - name: una cadena, indica el nombre del modulo que fue llamado donde se
  encontro el error.

  - errors: arreglo con los errores encontrados.

- @call-incorrect-arg-number: Es reportado cuando se llama una funcion o
  procedimiento con el numero incorrecto de argumentos.

  - expected: el numero de argumentos que la funcion/procedimiento requiere.

  - received: el numero de argumentos que se uso en la llamada.

- @call-wrong-argument-type: Se reporta cuando el tipo del argumento *n* de
  una llamada no coincide con el tipo del parametro *n* en la declaración de
  la función/procedimiento.

  - expected: el tipo que se esperaba recibir, es el tipo del parametro *n*.

  - received: el tipo del argumento *n*, el que causó el error.

  - at: numero del argumento que causó el error (el primero es el nro. 1).

- @io-wrong-argument-type: Se reporta cuando se intenta leer o escribir un
  valor no "escribible"/"legible". Cabe aclarar que solo se pueden leer o
  escribir cadenas y valores de los tipos basicos.

  - received: tipo del argumento que causó el error.

  - name: nombre de la función.

  - at: numero del argumento que causó el error (el primero es el nro. 1).

- non-integer-index: es reportado cuando se usa un indice no-entero al invocar
  un arreglo.

  - at: numero del indice que causo el error.

- @condition-invalid-expression: es reportado cuando se usa una expresion que
  no sea booleana en la condicion de alguna estructura de control.

  - received: tipo de la expresion usada para controlar la expresion.

- @expression-incompatible-type: es reportado cuando un operador no es
  compatible con el tipo de datos de alguno de los operandos que recibió.

  - received: tipo del operando incompatible

  - operator: nombre del operador (**NOTA: falta agregar esta prop**)

- @expression-incompatible-comparison: es reportado cuando se intenta comparar
  valores de tipos diferentes o incompatbiles.

  - first: tipo del valor a la izquierda del operador de comparacion.

  - second: tipo del valor a la derecha del operador de comparacion.

- @call-error: objeto que contiene informacion sobre los errores encontrados
en una llamada. Tiene tres campos

## Reportados por el Evaluador

[ESCRIBIR ESTO]

# Obsoletos

Aca van los nombres de los errores obsoletos. La mayoria quedó de los errores
quedaron obsoletos porque el nuevo sistema de tipos soporta una situacion que
antes se consideraba un error. Otros estan aca porque fueron suprimidos del
nuevo sistema por simplicidad y tal vez sean agregados mas adelante. De no ser
así, se va a aclarar la razón.

- array-not-enough-indexes: era para cuando se invocaban arreglos con una
cantidad de indices menor a su dimension, lo que ahora esta perimitido.

- array-missing-index: era para cuando se invocaba un arreglo sin ningun
indice (ahora esta permitido).

- var-isnt-array: era para cuando una variable normal se invocaba como
un arreglo (con indices). Ahora este error pasaria a ser
`@invocation-too-many-indexes` y seria atrapado por Typer.

- @assignment-undefined-variable-with-type: se usaba cuando el usuario intentaba
asignar a una variable no declarada y se podia calcular el tipo de la expresion
que queria asignarle. Puede que sea agregado mas adelante.

- @expression-undefined-variable: su reemplazo va en typer.
