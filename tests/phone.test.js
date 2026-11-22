import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone, toE164 } from '../api/_phone.js'

describe('normalizePhone', () => {
  it.each([
    ['0244123456', '0244123456'],
    ['0244 123 456', '0244123456'],
    ['0244-123-456', '0244123456'],
    [' +233244123456 ', '0244123456'],
    ['+233 24 412 3456', '0244123456'],
    ['233244123456', '0244123456'],
    ['00233244123456', '0244123456'],
    ['0501234567', '0501234567'],
    ['0201234567', '0201234567'],
  ])('canonicalises %s to %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each([
    ['', null],
    [null, null],
    [undefined, null],
    ['024412345', null], // too short
    ['02441234567', null], // too long
    ['0123456789', null], // invalid prefix
    ['+447700900123', null], // not a Ghana mobile
    ['hello', null],
  ])('rejects %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })
})

describe('toE164', () => {
  it('converts the canonical local form', () => {
    expect(toE164('0244123456')).toBe('+233244123456')
  })

  it('accepts any supported input form', () => {
    expect(toE164('+233 24 412 3456')).toBe('+233244123456')
  })

  it('returns an empty string for invalid input', () => {
    expect(toE164('nope')).toBe('')
  })
})

describe('formatPhone', () => {
  it('groups the local number for display', () => {
    expect(formatPhone('0244123456')).toBe('0244 123 456')
  })

  it('falls back to the raw value', () => {
    expect(formatPhone('nope')).toBe('nope')
  })
})
