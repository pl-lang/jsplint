Durante el proceso de ejecutar un programa se emiten diferentes eventos. Estos son listados a continuacion en el orden en el cual serian emitidos.

#### Durante la "compilacion"
- scan-started
- syntax-error o correct-syntax
- scan-finished

Si no se encontraron errores de sintaxis, el programa pasa al interprete donde este lo ejecuta.

#### Durante la interpretacion
- program-started
- evaluation-error (opcional)
- step-executed (se emite tantes veces como enunciados tenga el programa)
- program-paused (opcional)
- program-finished

Cabe aclarar que una vez que se ha emitido `evaluation-error` la ejecucion del programa finaliza, por lo que tambien se emite `program-finished`.
