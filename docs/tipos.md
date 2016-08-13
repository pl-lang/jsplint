# Tipos
Se necesita un sistema que permita verificar que no haya errores en las
expresiones que el usuario utiliza para manipular los valores de las variables
de su programa.

El lenguaje que se busca implementar especifica 4 tipos basicos: enteros,
reales, caracteres, y valores logicos (verdadero, falso). Ademas, se pueden
crear arreglos de dimensiones arbitrarias (preferentemente) de valores de
cualquiera de estos tipos. Por lo tanto el sistema tiene que poder describir
el tipo de un arreglo 'invocado' con menos indices que su cantidad de
dimensiones.

Hasta ahora (bc68829) los tipos de las variables y expresiones se representaban
unicamente con cadenas de texto y solo estaban permitidos los 4 tipos basicos.
A partir de ahora voy a intentar usar el siguiente formato:

```js
Tipo {
  simple: 'entero' | 'real' | 'logico' | 'caracter',
  dimension: [enteros]
}

```

_Nota: ademas de los tipos basicos la propiedad `simple` tambien podria tomar
los valores `'cualquiera'` y `'ninguno'`_

Entonces, `simple` es una cadena que describe cual es el tipo 'basico/atomico'
de la expresion o variable y `dimension` es un arreglo de enteros que indica el
tamaño de cada una de las dimensiones de la variable. Con esos dos campos la
estructura `Tipo` puede describir todos los que puede tener una variable o
expresión en este lenguaje.

Por ejemplo: una variable común y corriente que almacena un valor entero puede
tener un tipo de:
```js
Tipo { simple: 'entero', dimension: [1] }
```
Se ve que una variable 'normal' se representa como un vector con una celda. Un
vector más grande cambiaría el 1 por algún otro numero, mientras que una matriz
podria tener una dimension igual a `[2, 4]`

Además, como la estructura presentada debe ser capaz de escribir los tipos de
retorno de las funciones y los tipos de los parametros que estas toman, hace
falta agregar 2 tipos 'atómicos' más:

  - `ninguno`: utilizado para representar a los procedimientos, funciones que no
  retornan ningun valor.

  - `cualquiera`: utilizado para representar a parametros que aceptan
  expresiones de cualquier tipo.

Ninguno de los 2 valores anteriores está disponible para el usuario.

A partir de ahora el parser debería dejar de asignar tipos a las expresiones
y 'enfocarse' en producir estructuras que representen la sintaxis. Luego, se
transformará el ast en una estructura similar pero donde intervienen
unicamente situaciones donde se debe verificar las reglas de tipado, es decir
operaciones, asignaciones a variables, invocaciones, y llamadas a funciones o
procedimientos. El chequeo de tipos se hará utilizando esta última estructura
y no debería ser muy diferente a un evaluador.

Asignarle un tipo a una expresión  requiere información sobre ésta, por eso a
partir de ahora las expresioens tendrá una propiedad llamada `kind` que
indicará que clase de expresión pertencen.

Hay 4 clases:

  - literal: incluye a todos los valores 'crudos'

  - invocation: para las invocaciones de variables

  - call: para las llamadas a funciones

  - any: esta clase incluye a las demas y está pensada para las funciones
  `leer`, `escribir` y `escribir_linea`

Las clases de expresion sirven 2 propositos. Cuando se las encuentra en una
expresion simplemente indican su clase, y cuando están anotando a un
_parámetro_ indican que clase de expresiones acepta dicho parámetro.

Las clases se anotan al nivel del Parser y luego se utilizan en el proceso de
chequeo de tipado.

# Chequeo

El TypeChecker entiende (entenderá) solo 2 enunciados/acciones:

  - asignaciones

  - llamadas

Esto se debe a que en este lenguaje no hay ningun otro lugar donde intervengan
los tipos.

_Nota: Para cuando se llega al TypeChecker ya se debería haber revisado que
todas las variables y funciones existan (hayan sido declaradas)._

El TypeChecker solo debe comprobar que los tipos involucrados en dichos
enunciados cumplan ciertas reglas. Las reglas podrían implementarse como
funciones que toman los tipos en cuestión y devuelven un reporte.

Las asignaciones deben cumplir que:

  - el tipo de lado izquierdo sea compatible con el del lado derecho, o que
  sean iguales.

Las llamadas deben cumplir que:

  - parametro a parametro, los tipos de las expresiones pasadas sean compatibles
  o iguales y sus clases sean iguales.

Como la mayoría de las expresiones involucrarán operadores, sus tipos tendrán
que ser calculados.

Así como los operadores se aplican a valores en el evaluador, se aplicarán a
tipos en TypeChecker.

Los operadores y las funciones serán funciones que tomen cierta cantidad de
tipos y produzcan un nuevo tipo.
