import { describe, expect, it } from 'vitest'
import { plainText } from './text'

describe('plainText', () => {
  it('strips single-asterisk emphasis', () => {
    expect(plainText('they mean *now*, not later')).toBe('they mean now, not later')
    expect(plainText('is *this* system')).toBe('is this system')
  })

  it('leaves arithmetic and lone asterisks alone', () => {
    expect(plainText('2 * 3 * 4')).toBe('2 * 3 * 4')
    expect(plainText('a*b*c')).toBe('a*b*c')
    expect(plainText('SELECT * FROM t')).toBe('SELECT * FROM t')
  })

  it('still strips bold, code and abbreviations', () => {
    expect(plainText('**[[TTL|TTLs]]** and `GET`')).toBe('TTLs and GET')
  })
})
