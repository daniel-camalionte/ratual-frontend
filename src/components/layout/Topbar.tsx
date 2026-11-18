import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Dropdown from 'react-bootstrap/Dropdown'
import { Icon } from '@/components/ui/Icon'
import { Avatar } from '@/components/ui/Avatar'
import { Brand } from '@/components/ui/Brand'
import { useAuth } from '@/lib/auth'
import { applyTheme, getTheme, type Theme } from '@/lib/theme'
import { MobileNav } from './MobileNav'

export function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    setTheme(next)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="topbar rounded-0 border-0 text-bg-primary">
      <nav className="navbar container-fluid flex-nowrap rt-topbar" aria-label="Barra superior">
        <div className="d-flex align-items-center gap-1 min-w-0">
          <button type="button" className="rt-icon-btn d-xl-none" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}>
            <Icon name="menu-2" />
          </button>
          <Link to="/" className="rt-brand" aria-label="Refrigeração Atual - início">
            <Brand light markSize={26} />
          </Link>
        </div>

        <div className="d-flex align-items-center gap-1 ms-auto flex-shrink-0">
          <Dropdown align="end">
            <Dropdown.Toggle as="button" type="button" className="rt-icon-btn position-relative" aria-label="Notificações">
              <Icon name="bell" />
              <span className="rt-dot" aria-hidden="true" />
            </Dropdown.Toggle>
            <Dropdown.Menu className="py-0 rt-dropdown-wide">
              <div className="px-3 py-3 border-bottom fw-semibold">Notificações</div>
              <Dropdown.ItemText className="text-muted py-3">Nenhuma notificação por enquanto.</Dropdown.ItemText>
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown align="end">
            <Dropdown.Toggle as="button" type="button" className="rt-icon-btn" aria-label="Menu do usuário">
              <Avatar name={user?.nome ?? 'Usuário'} size={34} />
            </Dropdown.Toggle>
            <Dropdown.Menu className="rt-dropdown-wide">
              <div className="px-3 py-2">
                <div className="fw-semibold text-truncate">{user?.nome}</div>
                <small className="text-muted text-truncate d-block">{user?.login}</small>
              </div>
              <Dropdown.Divider />
              <Dropdown.Item className="py-2" onClick={toggleTheme}>
                <Icon name={theme === 'light' ? 'moon' : 'sun'} className="me-2" />
                {theme === 'light' ? 'Tema escuro' : 'Tema claro'}
              </Dropdown.Item>
              <Dropdown.Item className="py-2" onClick={() => void handleLogout()}>
                <Icon name="logout" className="me-2" />
                Sair
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </nav>
      <MobileNav show={menuOpen} onHide={() => setMenuOpen(false)} />
    </header>
  )
}
