# Evaluador

El evaluador es la parte del interprete encargada de ejecutar las instrucciones del programa, es decir, es el que calcula
el valor final de las expresiones, el que asigna los valores a las variables, el que informa al interprete que se debe
escribir algo en pantalla, etc.

El evaluador es basicamente una maquina que cuenta con una pila, una lista de variables, y puede ejecutar instrucciones.
Todas las instrucciones u operadores manipulan los valores de la pila, y algunas pueden, ademas, tener efectos secundarios como asignar
el valor al tope de la pila a una variable o poner al evaluador en pausa. Algunos operadores tienen un retorno, es decir
que devuelven un valor, como los operadores matematicos. Todos los operadores son post-fijos.

Las instrucciones a ejecutar se obtienen transformando el programa original.

Los operadores que manipulan las variables son ASSIGN y GET, y los que manipulan celdas de vectores son ASSIGNV y GETV.

La sintaxis de ASSIGN es: variable ASSIGN y asigna el valor al tope de la pila a la variable en el indice especificado.

La sintaxis de GET es: variable GET y pone el valor de la variable en el indice especificado al tope de la pila.

La sintaxis de ASSIGNV es: variable indice ASSIGNV y asigna el valor al tope de la pila al vector en el indice especificado.

La sintaxis de GETV es: variable indice GETV y pone el valor del vector en el indice especificado al tope de la pila.