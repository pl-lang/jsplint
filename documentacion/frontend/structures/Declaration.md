declaracion:

`<tipo><lista de nombres>`

`<tipo><lista de nombres><declaracion>`

`<tipo><lista de nombres>','<declaracion>`

tipo:

  `'entero'`

  `'real'`

  `'logico'`

  `'caracter'`

lista de nombres:

  `<nombre>`

  `<nombre>','<lista de nombres>`

nombre:

  `<palabra>`

  `<palabra>'['<lista de dimensiones>']'`

lista de dimensiones:

  `<entero>`

  `<entero>','<lista de dimensiones>`

Cadenas que coinciden con el patron de declaracion:

```
"entero variable1, dos, tres, OK"

"real b, caracter nombre[10, 10]"
```
