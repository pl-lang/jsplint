'use strict'

export {default as Parser} from './src/parser/Parser.js'
export {default as Declarator} from './src/transformer/Declarator'
export {default as CallDecorator} from './src/transformer/CallDecorator'
export {default as Interpretable} from './src/transformer/Interpretable'
export {Program, Statement, StatementKinds} from './src/interfaces/Program'