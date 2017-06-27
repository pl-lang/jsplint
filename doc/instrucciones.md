# Instrucciones soportadas por el Evaluador

## Operaciones matematicas, logicas, y de comparacion

Toman como operadores la cantidad de elementos que necesiten de la pila, realizan la operacion correspondiente, y apilan el resultado.

Operaciones matematicas: SUMAR, RESTAR, DIV\_REAL, DIV\_ENTERO, MODULO, MULTIPLICAR, ELEVAR, NEGAR

Operaciones logicas: NOT, AND, OR

Operaciones de compracion: MENOR, MENORIGUAL, MAYOR, MAYORIGUAL, IGUAL, DIFERENTE

## Operaciones de pila

APILAR X: apila el valor literal X

APILAR VAR X: apila el valor de la variable (local o global) X

APILAR ARR X, Y: apila el valor de una celda del arreglo X. El indice de la celda se calcula usando Y indices (tomados de la pila) y usando las
longitudes de las dimensiones del arreglo.

ASIGNAR X: asignar a X el valor que esta al tope de la pila.

ASIGNAR ARR X, Y: asignar a una celda del arreglo X el valor que esta al tope de la pila. El indice de la celda se calcula usando Y indices (tomados
de la pila) y usando las longitudes de las dimensiones del arreglo.

## Operaciones de salto

Cambian el numero de instruccion en ejecucion.

JIF X: Saltar si falso. Salta a la instruccion numero X si el valor al tope de la pila es falso.
JMP X: Saltar incondicionalmente. Salta a la instruccion numero X.

## Llamadas

LLAMAR X: llamar al modulo con nombre X

LEER X, Y: Leer un valor de para la variable X de tipo Y.

ESCRIBIR: Tomar el valor al tope de la pila y lo escribe.

## Operaciones con cadenas

CONCATENAR X: toma X caracteres de la pila, los concatena, y apila el resultado.

ASIGNAR CAD X, Y, Z: asigna la cadena al tope de la pila a la variable X, de longitud Y, a partir de la celda determinada con los primeros Z indices
al tope de la pila y las longitudes de las dimensiones de X.

## Otras operaciones

ALIAS X, Y, Z: hacer un alias X a la variable Y invocada con Z indices (Z es de tipo number[]). Un alias es una referencia hacia una variable ubicada en otro modulo.

COPIAR ARR X, Y: copiar los contenidos del vector Y al vector X. X e Y son del tipo VectorData.

MKFRAME X: crear un nuevo "cuadro" del modulo X en la pila de cuadros. Un cuadro es el espacio de memoria de un modulo, en el viven sus variables y/o aliases.

INIT ARR X: inicializa el vector X de un modulo con un vector pasado como argumento en la llamada. X es del tipo VectorData.