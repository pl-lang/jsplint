# Patterns (patrones)
Los *Patterns* son, en esencia, funciones que verifican si una lista (en realidad, una cola) de tokens coincide con cierto patrón
predeterminado. Están implementados como objetos con un solo método llamado `capture` que realiza todo el trabajo. Este método
siempre devuelve un objeto con dos propiedades `error` y `result`. La primera siempre es `true` o `false` e indica si la lista
de tokens coincidió o no con el patrón dado. Si `error : true` entonces `result` es un objeto que contiene información sobre el
error por el cual no se logró una coincidencia con el patrón:

Propiedad              | Descripcion
-----------------------|--------------------
unexpectedToken        | Cadena que indica el tipo del primer token que no coincide con el patron
expectedToken          | Cadena que indica el tipo de token que se esperaba encontrar
atColumn               | Entero que indica en que renglón se encontró el token inesperado
atLine                 | Entero que indica en que columna se encontró el token inesperado

Si `error : false` entonces el valor de `result` varía. En el caso de `IntegerPattern`, por ejemplo, que captura un token de tipo
`integer`, `result` es un numero, obtenido de la propiedad `value` del token capturado. Por otro lado, para `VariableListPattern`
`result` es un `arreglo` de nombres de variable.
