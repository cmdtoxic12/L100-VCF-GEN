import { describe, expect, it } from 'vitest'
import { buildVCF } from '../api/_vcf.js'

const contact = {
  full_name: 'Ama Serwaa Mensah',
  whatsapp: '0244123456',
  level: 'L100',
}

function lines(vcf) {
  return vcf.split('\r\n').filter(Boolean)
}

describe('buildVCF', () => {
  it('emits a well-formed vCard 3.0 entry', () => {
    const vcf = buildVCF([contact])
    const rows = lines(vcf)

    expect(rows[0]).toBe('BEGIN:VCARD')
    expect(rows).toContain('VERSION:3.0')
    expect(rows).toContain('FN:Ama Serwaa Mensah')
    expect(rows).toContain('N:Mensah;Ama Serwaa;;;')
    expect(rows).toContain('TEL;TYPE=CELL:+233244123456')
    expect(rows.at(-1)).toBe('END:VCARD')
  })

  it('uses CRLF everywhere and ends with a blank line', () => {
    const vcf = buildVCF([contact])
    expect(vcf.endsWith('END:VCARD\r\n')).toBe(true)
    expect(vcf.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('exports legacy numbers in E.164', () => {
    const vcf = buildVCF([{ ...contact, whatsapp: '+233 24 412 3456' }])
    expect(vcf).toContain('TEL;TYPE=CELL:+233244123456')
  })

  it('escapes separators, backslashes and newlines (no vCard injection)', () => {
    const vcf = buildVCF([
      { ...contact, full_name: 'Ama; B\nTEL:999999', whatsapp: '0244123456' },
    ])

    expect(vcf).toContain('FN:Ama\\; B\\nTEL:999999')
    expect(lines(vcf).filter((line) => line.startsWith('TEL;'))).toHaveLength(1)
    expect(vcf).not.toContain('\nTEL:999999')
  })

  it('escapes backslashes in names', () => {
    const vcf = buildVCF([{ ...contact, full_name: 'A\\B' }])
    expect(vcf).toContain('FN:A\\\\B')
  })

  it('puts single-word names in the family field', () => {
    const vcf = buildVCF([{ ...contact, full_name: 'Ama' }])
    expect(vcf).toContain('N:Ama;;;;')
  })

  it('skips rows without a name', () => {
    const vcf = buildVCF([{ ...contact, full_name: '   ' }, contact])
    expect(vcf.match(/BEGIN:VCARD/g)).toHaveLength(1)
  })

  it('handles an empty list', () => {
    expect(buildVCF([])).toBe('')
    expect(buildVCF(null)).toBe('')
  })
})
