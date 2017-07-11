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

## Operaciones de registro

Hay un solo registro.

APILAR_R: pone el valor del registro al tope de la pila.

ASIGNAR_R: asigna el valor al tope de la pila al registro.

## Operaciones de salto

Cambian el numero de instruccion en ejecucion.

JIF X: Saltar si falso. Salta a la instruccion numero X si el valor al tope de la pila es falso.
JIT X: Saltar si verdadero. Salta a la instruccion numero X si el valor al tope de la pila es verdadero.
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

REFERENCIA X, Y, Z: crea una referencia X a la variable Y invocada con Z indices (Z es de tipo number). Ahora X hace referencia a Y, una variable ubicada en otro modulo.

COPIAR ARR U, V, X, Y: copiar los contenidos del vector X con Y indices al vector U con V indices. U y X son los nombres de los vectores, V e Y son numeros.

INIT ARR X, Y: inicializa el arreglo de nombre X de un modulo con un vector Y pasado como argumento en la llamada. Y es del tipo VectorData.