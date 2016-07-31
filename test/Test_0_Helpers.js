import should from 'should'

import {take, zip, zipObj} from '../src/utility/helpers.js'

describe('zip', () => {
  it('con listas de igual longitud', () => {
    let a = [1, 2, 3]
    let b = [4, 5, 6]

    zip(a, b).should.deepEqual([
      [1, 4],
      [2, 5],
      [3, 6]
    ])
  })

  it('con listas de diferente longitud', () => {
    {
      let a = [1, 2, 3]
      let b = [4, 5]

      zip(a, b).should.deepEqual([
        [1, 4],
        [2, 5]
      ])
    }

    {
      let a = [1, 2]
      let b = [4, 5, 6]

      zip(a, b).should.deepEqual([
        [1, 4],
        [2, 5]
      ])
    }
  })
})

describe('zipObj', () => {
  it('con listas de igual longitud', () => {
    let vs = [1, 2, 3]
    let ns = ['fst', 'snd', 'trd']

    zipObj(vs, ns).should.deepEqual({
      fst:1,
      snd:2,
      trd:3
    })
  })

  it('con listas de distinta longitud', () => {
    let vs = [1, 2, 3]
    let ns = ['fst', 'snd']

    zipObj(vs, ns).should.deepEqual({
      fst:1,
      snd:2
    })
  })
})
