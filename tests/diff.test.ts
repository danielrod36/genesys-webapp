import { describe, it, expect } from 'vitest'
import { diffObjects } from '../src/lib/audit'

describe('diffObjects utility', () => {
  it('detects changes in simple objects', () => {
    const oldObj = { a: 1, b: 2 }
    const newObj = { a: 1, b: 3, c: 4 }
    const result = diffObjects(oldObj, newObj)
    expect(result).toEqual({
      b: { before: 2, after: 3 },
      c: { before: undefined, after: 4 },
    })
  })

  it('returns empty diff when objects are identical', () => {
    const oldObj = { a: 1 }
    const newObj = { a: 1 }
    const result = diffObjects(oldObj, newObj)
    expect(result).toEqual({})
  })
})