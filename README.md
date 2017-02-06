# Qué es esto?

Este modulo es un interprete para un lenguaje de programacion diseñado para ser facil de aprender y para introducir el paradigma de la programacion estructurada.
Este documento detalla la mínima cantidad de pasos necesarios para ejecutar un programa. La sintaxis del lenguaje puede revisarse en [OTRO DOCUMENTO]. Podes probar
el lenguaje en https://pl-lang.github.io/playground/

# Como lo uso?

Este interprete esta diseñado para utilizarse como modulo de un programa que provea la interfaz del usuario. Eso significa que este modulo solo se encarga de la
"compilacio", la verificacion, y la ejecucion de un programa. Las tareas de permitir al usuario ingresar un programa y mostrar los resultados de este quedan a
cargo de la interfaz, el program que consume este modulo.

Para usarlo basta con instalarlo ejecutando lo siguiente:

```
npm install interprete-pl
```

Y listo. NPM es el administrador de paquetes de Node.js. Viene incluido al instalar Node.

### Ejemplo:

```
variables
inicio
    escribir("El cuarto termino de la secuencia Fibonacci es:", fibo(4))
fin

entero funcion fibo (entero n)
    entero r
inicio
    si (n < 2) entonces
        retornar n
    sino
        retornar fibo(n-1) + fibo(n-2)
    finsi
finfuncion
```

# Cómo se usa?
La ejecución de un programa tiene 3 pasos: la lectura, la transformación, y la interpretación. Este modulo exporta "herramientas" para cada una de esas tareas:
la clase `Parser`, la función `transform`, y la clase `Interpreter`. Antes de usarlas hay que importarlas: 

```js
import {Parser, Interpreter, transform, typecheck} from 'interprete-pl'

// A continuacion, creo una instancia de Parser.

const p = new Parser()
```
Ahora, asumiendo que el programa a ejecutar es una cadena en la variable `prog` hacemos:

```js
const programa_leido = p.parse(prog)
```

El método `parse` devuelve un *reporte*, un objeto con dos propiedades: `error` y `result`. Si `error` es verdadero, entonces `result` contiene un arreglo
de los errores sintacticos y lexicos encontrados durante la lectura del programa. En cambio, si `error` es falso, `result` contiene una estructura que
representa al programa. Ahora, esta estructura debe ser transformada para que pueda interpretarse:

```js
const programa_ejecutable = transform(programa_leido.result)
```

`transform` también devuelve un reporte. Si `error` es verdadero entonces `result` contendrá un arreglo de los errores encontrados durante la transformacion.

Asumiendo que no hubo errores durante las transformaciones, hay que revisar que el programa no contenga errores de tipado. Para eso se usa la funcion `typecheck`
 de la siguiente manera:

```js
const errores_de_tipado = typecheck(programa_ejecutable.result)
```

`typecheck` devuelve un arreglo de los errores encontrados asi que basta con revisar que ese arreglo tenga longitud = 0 para saber que no hubo errores de tipado:

```js
    if (errores_de_tipado.length == 0) {
        // Aca ejecutaremos el programa
    }
    else {
        // Mostrar al usuario los errores encontrados
    }
```

Por ultimo, para ejecutar el programa hay que crear una instancia de `Interpreter` y asignarle callbacks (funciones que responden a un evento) a los eventos `read` y `write`:

```js
const i = new Interprete(programa_ejecutable.result)

// Agregamos funciones para los eventos read y write del interpete:

i.on('read', () => {/*funcion que lee datos, se los pasa al interprete y resume la ejecucion*/})

i.on('write', () => {/*funcion que muestra datos en la pantalla*/}))

// Y ejecutamos el programa:

i.run()
```

Y listo. El programa fue ejecutado.

Los eventos `read` y `write` son los eventos mas importantes que emiten los interpretes porque permiten al programa interactuar con el usuario. La funcion que se enganche a ellos
depende mucho del entorno donde se ejecuta el programa, pero, en escencia, la funcion que responda a `write` debe escribir cosas en la pantalla y la que responda a `read` debe
permitir al que usuario ingrese un valor, debe enviarselo al interprete, y debe resumir la ejecucion del programa.