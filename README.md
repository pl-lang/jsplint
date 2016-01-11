# Qué es esto?

Este paquete es un interprete para un lenguaje de programacion diseñado para ser facil de aprender y para introducir el paradigma de la programacion estructurada.

# Cómo se usa?
Primero se debe importar el modulo y luego hay que crear una una instancia del controlador.

```js
const InterpreterController = require('interprete-pl')

const controlador = new InterpreterController()
```

El proceso de ejecucion (traduccion y evaluacion) de un programa genera eventos (como un pedido de datos al usuario o la escritura de datos en pantalla). Para usar el interprete hay que registrar funciones que se ejecutaran cuando un evento particular ocurra. Hay una descripcion detallada de los eventos en [OTRO ARCHIVO]

```js
controlador.on('write', (value_list) => {})

controlador.on('read', (var_list) => {})

controlador.on('syntax-error', () => {})

controlador.on('evaluation-error', () => {})

controlador.on('correct-syntax', () => {})
```

Una vez que se han registrado todas las funciones necesarias se puede llamar a la funcion `controller.run()` pasandole como unico argumento el codigo del programa. Dicha funcion se encarga de reaelizar todos los pasos necesarios para ejecutar el programa.

# Desarrollo
