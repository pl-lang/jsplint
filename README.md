# Qué es esto?

Este paquete es un interprete para un lenguaje de programacion diseñado para ser facil de aprender y para introducir el paradigma de la programacion estructurada.
Este documento detalla la mínima cantidad de pasos necesarios para ejecutar un programa.

# Cómo se usa?
La ejecución de un program tiene 3 pasos: la lectura, la transformación, y la interpretación. Este modulo exporta "herramientas" para cada una de esas tareas:
la clase `Parser`, la función `transform`, y la clase `Interpreter`. Antes de usarlas hay que importarlas: 

```js
import {Parser, Interpreter, transform} from 'interprete-pl'

// A continuacion, creo una instancia de Parser.

const p = new Parser()
```

Durante la ejecución de un programa pueden ocurrir cosas a las que debemos reaccionar, como un error sintáctico o de tipado o la escritura 
de alguna valor en la salida. Para responder a estos eventos debemos asignarles funciones que se ejecuten cuando estos ocurran:

```js
// Parser e Interpreter son emisores de eventos y se puede asignar funciones a sus eventos
// a traves del método on.

// El evento any es un evento especial cuya funcion se ejecuta cuando el emisor emite cualquiera
// de sus eventos.

p.on('any', () => {console.log('El Parser emitió un evento...')})
```

*Nota: los eventos que emite cada clase estan listados en [OTRO DOCUMENTO]*

Con los eventos "enganchados" a sus funciones podemos leer un programa. Asumiendo que dicho programa es una cadena en la variable `prog` hacemos:

```js
const programa_leido = p.parse(prog)
```

El método `parse` devuelve un *reporte*, un objeto con dos propiedades: `error` y `result`. Si `error` es verdadero, entonces `result` contiene una cadena con
el nombre del error que se encontró (a esta altura se emitieron datos adicionales sobre el error a traves del evento `syntax-error` o `lexical-error`). En cambio,
si `error` es falso, `result` contiene una estructura que representa al programa. Ahora, esta estructura debe ser transformada para que pueda interpretarse:

```js
const programa_ejecutable = transform(programa_leido.result)
```

`transform` también devuelve un reporte. Asumiendo que `error` es falso, `programa_ejecutable.result` es un objeto que debemos usar para crear el interprete:

```js
const i = new Interprete(programa_ejecutable.result)

// Agregamos funciones para los eventos read y write del interpete:

i.on('read', () => {/*funcion que hace algo...*/})

i.on('write', console.log)

// Y ejecutamos el programa:

i.run()
```

Y listo. El programa fue ejecutado.

Los eventos `read` y `write` son los eventos mas importantes que emiten los interpretes porque permiten al programa interactuar con el usuario. La funcion (o funciones)
que se enganche a ellos depende mucho del entorno donde se ejecuta el programa, pero, en escencia, la funcion que responda a `write` debe escribir cosas en la pantalla
y la que responda a `read` debe permitir al que usuario ingrese un valor, enviarselo al interprete, y resumir la ejecucion del programa.

Mas adelante cuando el chequeo de errores de tipado sea implementado cambiará un poco la etapa de la transformación porque se deberá aplicar dos transformaciones.
La primera analiza el programa y le asigna tipos de datos a sus expresiones, lo cual permite que `TypeChecker` revise que todo esté en orden. Hecho esto, si no se
encontraron erroes, se procede aplicar la segunda (la que fue aplicada mas arriba por `transform`) que hace que *correcto* pueda ser ejecutado.