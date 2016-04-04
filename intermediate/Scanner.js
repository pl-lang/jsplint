'use strict'

import MainModuleScanner from './scanners/MainModuleScanner.js'

import TokenQueue from './TokenQueue.js'

export default class Scanner {
  constructor(queue) {
    this.queue = queue
  }

  getModules() {
    let modules = {}

    let main_data = MainModuleScanner.capture(this.queue)

    if (main_data.error) {
      return main_data
    }
    else {
      modules.main = main_data.result
    }

    if (this.queue.current().kind == 'eof') {
      return {
          result : modules
        , error  : false
      }
    }
    else {
      return {error:true}
    }
  }
}
