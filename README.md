# Qué es esto?

Este paquete es un programa escrito en JavaScript que sirve para interpretar programas escritos en un lenguaje similar a Pascal.

# Cómo se usa?
Importarlo al proyecto:

```js
const InterpreterController = require('interprete-pl')

```
Tambien hace falta un objeto que se encargue de reaccionar a los mensajes que este genera:
```js
const MessageHandler = require('message-handler')

```
Crear una instancia de ``MessageHandler`` pasandole una funcion. Dicha funcion toma un mensaje y es la que se debe encargar de reaccionar
a cada tipo de mensaje que ``InterpreterController`` puede generar:
```js
let mensajero = new MessageHandler( (mensaje) => {
  if (mensaje.subject == 'scan-started') {
    // ...
  }
  else if (mensaje.subject == 'scan-finished') {
    // ...
  }
  else {
    // ...
  }
} )

```
Ahora hay que crear una instancia de InterpreterController y agregar ``mensajero`` a la lista de receptores.
```js
let controller = new InterpreterController()
controller.addMessageListener(mensajero)

```
Echo eso, ya se puede utilizar el interprete para ejecutar codigo. Esto consta de tres pasos:
  - Escanear el codigo
  - Preparar el interprete
  - Ejecutar el codigo

Para escanear el còdigo hay que llamar a ``controller.scan(codigo)`` pasandole una cadena. Cualquier error de sintaxis que se encuentre sera informado en esta etapa por medio de un mensaje *incorrect-syntax*.

Si no hubo errores, ``controller`` envia un mensaje *correct-syntax*. Ahora solo queda preparar el interprete y ejecutar el codigo:
```js
controller.setUpInterpreter()
controller.run()

```


# Desarrollo
