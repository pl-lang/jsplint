# Patterns (patrones)

Documentación para las funciones definidas en `/src/parser/Patterns.js`

Son funciones que verifican que una cola de tokens coincida (total o parcialmente) con un patrón dado y al mismo tiempo
procesan (agrupan, modifican, etc) los datos que se encuentran en ellos.

Devuelven un `Report`. Estos objetos tienen 2 propiedades: 'error' y 'result'.

Propiedad        | Descripcion
-----------------|--------------------
error (bool)     | Indica si la funcion encontró un error al procesar la cola de tokens
result (obj)     | Resultado de la funcion o datos sobre el error, en funcion del valor de `error`

Cuando `error:false`, `result` contiene:

Propiedad            | Descripcion
---------------------|--------------------
unexpected (string)  | Indica si la funcion encontró un error al procesar la cola de tokens
expected (string)    | Resultado de la funcion o datos sobre el error, en funcion del valor de `error`
line (int)           | Numero que indica en que línea se encontró el token inesperado
column (int)         | Numero que indica en que columna se encontró el token inesperado

Si `error:true` el resultado varía para cada función:

#### MainModule
```js
result = {
  type : 'module',
  name : 'main',
  locals : [Patterns.VariableDeclaration.result],
  body : [Patterns.Statement]
}

```

#### DeclarationStatement
```js
result = {
  type : 'declaration',
  variables : [Patterns.VariableList.result],
}

```

#### VariableList
```js
result = [Patterns.VariableDeclaration]

```

#### VariableDeclaration
```js
result = {
  name : 'string', // via Patterns.Word
  isArray :true | false,
  type : 'string', // via Patterns.TypeName
  bounds_checked : false,
  dimension : [int] | null
}

```
