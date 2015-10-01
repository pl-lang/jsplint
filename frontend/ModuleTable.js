'use strict'

class ModuleTable {
  constructor(moduleTemplates) {
    this.modules = {}

    // aca tendría que usar un while que me permita dejar de agregar cosas
    // si una plantilla esta repetida
    if (moduleTemplates)
      for (let template of moduleTemplates) {
        this.modules[template.name] = template
      }
  }

  has(moduleName) {
    return this.modules.hasOwnProperty(moduleName)
  }

  add(template) {
    if (this.has(template.name))
      return {
          error   : true
        , result  : {
            reason: 'repeated-template'
          , name  : template.name
        }
      }
    else
      this.modules[template.name] = template

      return {error:false}
  }

}

module.exports = ModuleTable
