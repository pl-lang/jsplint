# Estan

Errores que ya estaban en el viejo TypeChecker y fueron implementados al nuevo.

  - incompatible-types-at-assignment: para cuando el tipo de expresion que se
  quiere asignar a una variable no es compatible con el tipo de esta ultima.

  - @condition-invalid-expression: para cuando se usan expresiones de otro tipo
  que no sea logico en la condicion de una estructura de control.

  - @expression-incompatible-operator-types: para cuando en una expresion el
  operador no puede operar sobre los tipos de sus operandos.

  - non-integer-index: para cuando uno de los indices en la invocacion de una
  variable no es entero.

# Nuevos

Errores que el nuevo TypeChecker puede detectar.

- @call-incorrect-arg-number: para cuando una funcion es invocada con el numero
incorrecto de argumentos.

- @call-wrong-argument-type: para cuando el tipo de un argumento no coincide
con el tipo del parametro correspondiente.

- @expression-incompatible-comparison: para cuando se intenta comparar 2 tipos
(no numericos) diferentes


# No van en TypeChecker

Errores que no corresponden en el TypeChecker.

  - @expression-undefined-variable: tendria que ir en Typer, cuando Typer soporte
  errores.

  - @invocation-too-many-indexes: va en Typer. Para cuando los arreglos se invocan con
  demasiados indices.

  - @assignment-undefined-variable: va en Typer. Para cuando la variable del lado
  izquierdo de una asignacion no existe.

  - @assignment-undefined-variable-with-type: va en Typer. Para cuando se da la
  situacion anterior y se puede calcular el tipo de la expresión que se le
  quería asignar.

  - index-out-of-bounds: Ponerlo en el TypeChecker implica encontrar una forma de definir
  los intervalos en un tipo, algo así como:

    ~~~{.javascript}
    Type IntegerRange {
      atomic: 'integer',
      from: 1,
      to: 7
    }
    ~~~~~~~

  Pero eso es muy complicado y rompería todo. Probablemente. Los índices de los
  arreglos serían como parámetros. Habría que verificar que el tipo recibido como
  indice es entero y además habría que verificar que caiga en el rango especificado
  por el "tipo" del parametro.

  Seria más fácil hacer un grupo de funciones similares al TypeChecker que revisen las
  invocaciones de los arreglos que pueden verificarse estaticamente. Tendría que
  verificar y "transformar" a la vez, ya que las invocaciones deben tener la
  propiedad booleana `bounds_checked`.

  - repeated-variable: Tendría que ir en la transformacion que "declara" las
  variables.

  - procedure-return: esto podria ser un error de sintaxis (?). De ser así,
  debería ir en Patterns.js

#Faltan

Errores que deberian ir en TypeChecker pero que falta implementar.

  - leer-non-invocation-argument: este es complicado.

  - leer-variable-doesnt-exist: este tambien es complicado.

# Obsoletos

Aca van los nombres de los errores que ya no existen, generalmente
porque el nuevo sistema de tipos soporta una situacion que antes se consideraba
un error. De no ser así, se va a aclarar la razón.

  - array-not-enough-indexes: era para cuando se invocaban arreglos con una cantidad
  de indices menor a su dimension.

  - array-missing-index: era para cuando se invocaba un arreglo sin ningun indice.

  - var-isnt-array: era para cuando una variable normal se invocaba como un arreglo
  (con indices). Ahora este error pasaria a ser `@invocation-too-many-indexes` y
  seria atrapado por Typer.
