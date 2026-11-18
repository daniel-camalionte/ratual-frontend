// Telefone: o backend guarda so os digitos (com DDD); a tela mostra formatado.

/** Mascara enquanto digita: (11) 99999-0000 */
export function mascaraTelefone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** "11999990000" -> "(11) 99999-0000"; com DDI 55 na frente, ignora o DDI. */
export function formatarTelefone(d: string | null | undefined): string {
  if (!d) return ''
  const local = d.length > 11 && d.startsWith('55') ? d.slice(2) : d
  return mascaraTelefone(local)
}

/** Vazio ou com DDD (10 ou 11 digitos). */
export const telefoneValido = (v: string): boolean => {
  const n = v.replace(/\D/g, '').length
  return n === 0 || n === 10 || n === 11
}
