# Tipos
Se necesita un sistema que permita verificar que no haya errores en las
expresiones que el usuario utiliza para manipular los valores de las variables
de su programa.

El lenguaje que se busca implementar especifica 4 tipos basicos: enteros,
reales, caracteres, y valores logicos (verdadero, falso). Ademas, se pueden
crear arreglos de dimensiones (preferentemente) arbitrarias de valores de
cualquiera de estos tipos.

Hasta ahora (bc68829) los tipos de las variables y expresiones se representaban
unicamente con cadenas de texto y solo estaban permitidos los 4 tipos basicos.
A partir de ahora voy a usar el siguiente formato:

```js
Integer {
  kind: 'atomic',
  atomic: 'entero'
}

ArrayType {
  kind: 'array',
  length: <number>,
  contains: <tipo>
}
```

Para el sistema de tipos hay dos clases de tipos: los tipos atomicos y los tipos
de arreglos. Los tipos atomicos son los mas simples (entero, real, etc.) y los de
arreglos son una cantidad dada de valores de otro tipo. La propiedad `kind` indica
la clase de un tipo y es necesaria para saber como comparar un tipo con otro.

Para sbaer si dos tipos son iguales lo primero que hay que mirar es la propiedad
`kind` de cada uno. Si son de clases distintas entonces definitivamente no son
iguales. Si son de la misma clase, se puede seguir la comparacion para ver si
en realidad son iguales.

### Ejemplos

Un vector 7 de enteros tiene tipo:

```javascript
ArrayType {
  kind: 'array',
  length: 7,
  contains: Integer { kind: 'atomic', atomic:'entero' }
}
```

La propiedad `length` indica el tamaño del vector.

Una matriz 2x3 de valores enteros puede representarse como un vector 2 que en
cada celda contiene un vector 3 de enteros. Su tipo seria:

```javascript
ArrayType {
  kind: 'array',
  length: 2,
  contains: ArrayType {
    kind: 'array',
    length: 3,
    contains: Integer { kind: 'atomic', atomic:'entero' }
  }
}
```

Una variable común y corriente que almacena un valor entero puede tiene tipo:
```js
Integer { kind: 'atomic', atomic:'entero' }
```

# Tipado

Los tipos se asignan a las expresiones, llamadas, e invocaciones luego de que
todo el codigo ha sido analizado y se verificó que no hay errores de sintaxis.

Se toma la salida de `Parser` y se la transforma en otra estructura, declarando
las variables de cada modulo en el proceso (durante esta etapa se encuentran
las variables repetidas, de haber alguna). Luego se toma esa estructura y se la
transforma (con la funcion exportada por `Typer.js`) en otra que solo contiene
los enunciados donde se deben verificar los tipos (invocaciones, condiciones,
asignaciones, etc).

Durante este proceso se detectan otros errores, detallados en [OTRO DOC].

## Tipar expresiones

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

El chequeo de tipos se hará utilizando esta última estructura
y no debería ser muy diferente a un evaluador.

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
