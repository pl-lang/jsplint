'use strict'

export interface ReportInterface<ErrorType, SuccesType> {
    error : boolean,
    result : ErrorType | SuccesType
}

export class Report<E, S> implements ReportInterface<E, S> {
  error : boolean
  result : E | S
  /**
   * Construye un reporte. Se usa para operaciones que pueden fallar.
   * @param  {bool} error_ocurred indica si ocurrió un error durante la operacion
   * @param  {any} result      resultado de la operación o causa del error
   * @return {Report}             reporte
   */
  constructor(error_ocurred : boolean, result : E | S) {
    this.error = error_ocurred
    if (result) {
      this.result = result
    }
    else {
      this.result = null
    }
  }
}
