import {bind} from '../utility/helpers.js'

export default class Transformer {
  constructor (original_ast) {
    this.data = original_ast
    this.Transforms = []
  }

  add_transforms (...Transforms) {
    this.Transforms.push(...Transforms)
  }

  transform (original_ast) {
    let output = {error:false, result:original_ast}

    for (let Transform of this.Transforms) {
      let transformer = new Transform(this.data)

      output = bind(input => transformer.transform(input), output)
    }

    return output
  }
}
