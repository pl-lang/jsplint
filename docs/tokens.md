# Tokens
Los tokens (o fichas) son _palabras_ que tienen un significado en el lenguaje.
Se construyen a partir del código fuente de un programa agrupando uno o varios
caracteres que coincidan con un **patrón** predeterminado. Podríamos imaginar una
funcion que toma la cadena que constituye al código del programa y devuelve una
*cadena* de tokens. Si la construcción de los tokens no produjo ningún error
entonces no hubo errores *léxicos* (todas las palabras estaban bien escritas).

Los tokens se agrupan en 4 tipos (según lo que representen):
  - **NumberToken**: representa un número real o entero

  - **WordToken**: utilizado para nombres de variables, palabras reservadas, nombres de funciones y procedimientos

  - **StringToken**: representa una cada delimitada por **"**

  - **SpecialSymbolToken**: representa uno de los simbolos especiales (operadores y otros)

En el código los tokens están representados como objectos que poseen distintas propiedades:

Todos los tokens poseen las siguientes propiedades:

Nombre de la propiedad | Descripcion
-----------------------|--------------------
kind                   | Cadena que indica el tipo del token
text                   | La cadena del token
lineNumber             | Entero que indica en que renglón empieza el token
columnNumber           | Entero que indica en que columna empieza el token

**NumberToken** y **StringToken** tienen, además, otra propiedad llamada **value**
que indica el valor que representan (un numero o una cadena, respectivamente).

En todos los casos la propiedad `kind` puede tomar distintos valores. Por ejemplo,
para **NumberToken** `kind` puede ser `'real'` o `'entero'` para aclarar que ese
numero es un real o un entero.

# Errores léxicos
Estos se generan cuando un token encuentra un caracter inesperado durante su construcción.
Un caracter inesperado es cualquiera que no coincida con el patrón que el token busca. Por
ejemplo, el patrón que **NumberToken** busca es:

`número+(seguido opcionalmente por).número+`

El `+` representa "repetir una o más veces". Sabiendo eso, ese patrón puede traducirse a:

`Uno o más números seguidos opcionalmente por: un punto y uno o más números.`

Cabe aclarar que la serie de números luego del punto NO es opcional. Si hay un punto, debe
estar seguido por al menos un número.

Las cadenas `37` y `2.78` coinciden con el patrón buscado por NumberToken.

Qué pasa cuando el punto está seguido por, digamos, una letra? Se genera un error léxico.

A raíz de eso la propiedad `kind` del token cambia a `'LEXICAL_ERROR'` se le agrega otra
propiedad llamada 'errorInfo', la cual es otro objeto que contiene información sobre el
error en las siguientes propiedades:

Propiedad | Descripcion
-----------------------|--------------------
unexpectedChar         | caracter inesperado
atLine                 | entero que indica el renglón donde se produjo el error
atColumn               | entero que indica la columna donde se produjo el error
