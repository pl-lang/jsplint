# Referencia corta

Eventos emitidios con mas de un argumento.

- write: este evento le pasa a su callback como segundo argumento una lista de los valores que se deben mostrar en la pantalla.

- read: este evento le pasa a su callback dos argumentos extra. El primero es un arreglo de los nombres de las variables que el programador quiere cargar. El segundo es una funcion que debe llamarse cuando todos los valores han sido leidos. Esa funcion toma el arreglo de nombres y un arreglo que contenga los valores ingresados por el usuario.

# Eventos

Los eventos que emite el controlador del interprete son:

scan-started
scan-finished
correct-syntax
program-started
program-finished
step-executed
read
write
error
