# Qué es esto?

Este paquete es un interprete para un lenguaje de programacion diseñado para ser facil de aprender y para introducir el paradigma de la programacion estructurada.
Este documento detalla la mínima cantidad de pasos necesarios para ejecutar un programa.

# Cómo se usa?
El modulo está dividido en dos clases: Compiler e Interpreter. La primera es la encargada de transformar el codigo del usuario a una estructura de datos que la
segunda puede utilizar para ejecutar el programa.

Primero se deben importar ambas clases y luego crear una instancia del compilador.

```js
const Compiler = require('interprete-pl').Compiler
const Interpreter = require('interprete-pl').Interpreter

const compilador = new Compiler()
```

Luego hay que compilar un programa. Asumiendo que la cadena de texto del codigo está en la variable `programa`:
```js
let reporte_del_compilador = compiler.compile(programa, true)
```

`reporte_del_compilador` tiene dos propiedades: error y result. Si se encontró un error en el código, error será `true` y result contendrá una cadena con la clase
de error que se encontró. Si no, error será `false` y result será el programa compilado.

Asumiendo que no haya errores podemos crear una instancia de Interpreter, la clase que se encarga de ejecutar programas.

```js
// Al crear una instancia de Interpreter se le pasa como parametro un programa compilado.
let interprete = new Interpreter(reporte_del_compilador.result)
```

Durante la compilación y ejecución de un programa ocurren eventos. Al compilar un programa puede suceder, por ejemplo, que se encuentre un error de tipado
mientras que al ejecutarlo puede ocurrir que el programa ordene pedir datos o mostrarlos  en pantalla. El compilador y el interprete emiten estos
eventos y nos permiten reaccionar a ellos. Hay una descripcion detallada de los eventos (los datos que proveen y quien los emite) en [OTRO ARCHIVO].

Para reaccionar a los eventos se deben asignar funciones que seran ejecutadas cuando estos sean emitidos.

```js
// Para ejecutar correctamente un programa se debe reaccionar, como mínimo, a dos eventos:
// write y read
// Ambos emitidos por Interpreter
interprete.on('write', (ev_info, lista_de_valores) => {})
interprete.on('read', (ev_info, lista_de_valores) => {})
```
Qué deben hacer las funciones que reaccionen a ellos no es pertinente a este documento. Esa información se puede encontrar en [OTRO ARCHIVO].

Una vez que se han registrado todas las funciones necesarias se puede llamar a la funcion `interprete.run()` y nuestro programa será ejecutado.

## Ejemplo
Se puede ver una implementación de una interfaz de consola para el interprete en [OTRO REPO?]

# Desarrollo
