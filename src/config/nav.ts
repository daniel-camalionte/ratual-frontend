export interface NavItem {
  label: string
  icon: string
  to?: string
  children?: { label: string; to: string }[]
  /** Visibilidade: omitido = todos; 'admin' = perfil admin; 'camera' = empresa com camera contratada. */
  when?: 'admin' | 'camera'
}

/** Fonte unica do menu (horizontal no desktop, offcanvas no mobile). Mesma ordem do Brain. */
export const NAV: NavItem[] = [
  { label: 'Painel', icon: 'layout-dashboard', to: '/' },
  { label: 'Refrigeradores', icon: 'fridge', to: '/refrigeradores' },
  { label: 'Câmeras', icon: 'video', to: '/cameras', when: 'camera' },
  { label: 'Alertas', icon: 'bell-ringing', to: '/alertas' },
  { label: 'Serviços', icon: 'tool', to: '/servicos' },
  { label: 'Gestão', icon: 'settings', to: '/gestao', when: 'admin' },
  { label: 'Conta', icon: 'user', to: '/conta' },
]

/** Referencia do template (formularios, tabelas, graficos...): so aparece em desenvolvimento. */
export const NAV_TEMPLATE: NavItem = {
  label: 'Template',
  icon: 'components',
  children: [
    { label: 'Campos básicos', to: '/formularios/basico' },
    { label: 'Validação (cadastro)', to: '/formularios/validacao' },
    { label: 'Tabelas', to: '/tabelas' },
    { label: 'Gráficos', to: '/graficos' },
    { label: 'Botões', to: '/ui/botoes' },
    { label: 'Cards, alertas e badges', to: '/ui/cards' },
    { label: 'Modais e abas', to: '/ui/modais' },
  ],
}
