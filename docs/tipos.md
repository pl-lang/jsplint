# Tipos
Se necesita un sistema que permita verificar que no haya errores en las
expresiones que el usuario utiliza para manipular los valores de las variables
de su programa.

El lenguaje que se busca implementar especifica 4 tipos basicos: enteros,
reales, caracteres, y valores logicos (verdadero, falso). Ademas, se pueden
crear arreglos de dimensiones (preferentemente) arbitrarias de valores de
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

A partir de ahora el parser debería dejar de asignar tipos a las expresiones
y 'enfocarse' en producir estructuras que representen la sintaxis. Luego, se
transformará el ast en una estructura similar pero donde intervienen
unicamente situaciones donde se debe verificar las reglas de tipado, es decir
operaciones, asignaciones a variables, invocaciones, y llamadas a funciones o
procedimientos. El chequeo de tipos se hará utilizando esta última estructura
y no debería ser muy diferente a un evaluador.

Asignarle un tipo a una expresión  requiere información sobre ésta, por eso a
partir de ahora las expresiones tendrán una propiedad llamada `kind` que
indicará que clase de expresión pertencen.

Hay 3 clases:

  - literal: incluye a todos los valores 'crudos'

  - invocation: para las invocaciones de variables

  - call: para las llamadas a funciones

Las clases se anotan al nivel del Parser y luego se utilizan en el proceso de
chequeo de tipado.

# Clases de tipo

Las clases de tipo sirven para agrupar a tipos que tienen cierta caracteristica
en común. Por ejemplo, pertencen a la clase `writeable` todos los tipos que
pueden ser escritos en pantalla. Las voy a usar para restringir los tipos que
las funciones `leer`, `escribir`, y `escribir_linea` aceptan. Las clases (y los
tipos que estas contienen) deberán estar anotadas en TypeChecker.js.

Las clases existen unicamente para poder verificar los argumentos que se pasan
a dichas funciones, ya que no hay manera de representarlas en la sintaxis.

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

  - parametro a parametro:

    - si el parametro exige tipos de una clase, el tipo pasado debe pertenecer
    a esa clase

    - si el parametro especifica un tipo, el tipo pasado debe ser igual o
    compatible con el especificado

La unica excepcion son las llamadas a la funcion especial `leer`, donde se debe
revisar las expresiones que se hayan pasado como parametros sean invocaciones.

Por ultimo, como la mayoría de las expresiones involucrarán operadores,
sus tipos tendrán que ser calculados.

Así como los operadores se aplican a valores en el evaluador, se aplicarán a
tipos en TypeChecker.

Los operadores y las funciones (del usuario) serán funciones que tomen cierta
cantidad de tipos y produzcan un nuevo tipo.

Entonces, por ejemplo, los datos del chequeo podrían verse así:

Del lado izquierdo de la asignación:
```js
Expression {
  kind:'invocation',
  name:'variable_1',
  indexes:[1, 2]
}
```

Del lado derecho:
```js
Expression {
  kind:'literal',
  value:2.3
}

```
