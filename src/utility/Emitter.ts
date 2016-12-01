'use strict'

type Callback = (...params: any[])=>void 

export default class Emitter {
  public_events: string[]
  private callbacks: {
    any?: Callback[]
    [e: string]: Callback[]
  } 

  constructor(public_event_list: string[]) {
    this.public_events = public_event_list
    this.callbacks = {}
  }

  on(event_name: string, callback: Callback) {
    if (event_name in this.callbacks) {
      this.callbacks[event_name].push(callback)
    }
    else {
      this.callbacks[event_name] = [callback]
    }
  }

  /**
   * Se encarga de llamar a los callbacks de los eventos.
   * Si se registro un callback para 'any' entonces se lo llama para cada evento que sea emitido. Es el callback por defecto.
   * Si un evento tiene registrado un callback entonces este se ejecuta despues del callback por defecto.
   */
  emit(event_name: string, ...args: any[]) {
    if (this.callbacks.hasOwnProperty('any')) {
      for (let callback of this.callbacks.any) {
        callback(...args)
      }
    }

    if (this.callbacks.hasOwnProperty(event_name)) {
      for (let callback of this.callbacks[event_name]) {
        callback(...args)
      }
    }
  }

  /**
   * Repite un evento de otro emisor como si fuera propio. El evento puede registrar como publico o no.
   */
  repeat(event_name: string, emitter: Emitter, make_public: boolean, ...args: any[]) {
    if (make_public === true) {
      this.public_events.push(event_name)
    }
    const self = this
    emitter.on(event_name, function () {
      self.emit(event_name, ...args)
    })
  }

  /**
   * Emitir los eventos de otro emisor como si fueran propios.
   */
  repeatAllPublicEvents(emitter: Emitter) {
    for (let event_name of emitter.public_events) {
      this.repeat(event_name, emitter, true)
    }
  }
}
