export type Theme = 'light' | 'dark'
const KEY = 'ratual.theme'

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage indisponivel: segue o padrao */
  }
  return 'light'
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-bs-theme', theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignora */
  }
}
