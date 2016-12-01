'use strict'

export const isDigit = (char : string) => /\d/.test(char)
export const isLetter = (char : string) => /[a-zA-Z]/.test(char)
export const isWhiteSpace = (char : string) => /\s/.test(char) && (char !== '\n')
