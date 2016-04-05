'use strict'

// Esto NO funcionaba porque ambos archivos solo tienen un export: "default"
// export { Interpreter } from './src/interpreter/Interpreter.js'
// export { Compiler } from './src/parser/Compiler.js'

export { default as Interpreter } from './src/interpreter/Interpreter.js'
export { default as Compiler } from './src/parser/Compiler.js'
