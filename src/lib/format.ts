const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const num = new Intl.NumberFormat('pt-BR')

export const formatBRL = (v: number) => brl.format(v)
export const formatNumber = (v: number) => num.format(v)
