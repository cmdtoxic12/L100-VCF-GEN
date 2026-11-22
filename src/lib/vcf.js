/**
 * Generate a VCF (vCard 3.0) string from contacts array.
 * Each contact becomes: Full Name + "L100 · number" in the note / org.
 */
export function generateVCF(contacts) {
  return contacts
    .map((c) => {
      const name = (c.full_name || '').trim()
      const phone = (c.whatsapp || '').trim()
      const level = c.level || 'L100'

      let vcard = 'BEGIN:VCARD\r\n'
      vcard += 'VERSION:3.0\r\n'
      vcard += `FN:${name}\r\n`
      vcard += `N:${name};;;;\r\n`
      vcard += `TEL;TYPE=CELL,WHATSAPP:${phone}\r\n`
      vcard += `ORG:${level}\r\n`
      vcard += `NOTE:${level} · ${phone}\r\n`
      vcard += 'CATEGORIES:L100,Classmate\r\n'
      vcard += 'END:VCARD\r\n'
      return vcard
    })
    .join('')
}

export function downloadVCF(contacts, filename = 'L100_Contacts.vcf') {
  const content = generateVCF(contacts)
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
