'use strict'

export const isDigit = char => /\d/.test(char)
export const isLetter = char => /[a-zA-Z]/.test(char)
export const isWhiteSpace = char => /\s/.test(char) && (char !== '\n')
