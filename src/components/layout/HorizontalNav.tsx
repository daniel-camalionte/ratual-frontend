import { Link, useLocation } from 'react-router-dom'
import { useNavItems } from '@/config/useNavItems'
import { Icon } from '@/components/ui/Icon'

/** Menu horizontal (desktop). O dropdown abre por CSS (hover/focus-within) usando as classes do template. */
export function HorizontalNav() {
  const { pathname } = useLocation()
  const items = useNavItems()

  return (
    <aside className="left-sidebar with-horizontal">
      <div>
        <nav id="sidebarnavh" className="sidebar-nav scroll-sidebar container-fluid" aria-label="Menu principal">
          <ul id="sidebarnav">
            {items.map((item) => {
              const childActive = item.children?.some((c) => c.to === pathname) ?? false
              const selfActive = item.to === pathname
              return (
                <li key={item.label} className={`sidebar-item ${childActive || selfActive ? 'selected' : ''}`}>
                  {item.to ? (
                    <Link to={item.to} className={`sidebar-link ${selfActive ? 'active' : ''}`} aria-current={selfActive ? 'page' : undefined}>
                      <Icon name={item.icon} className="aside-icon" />
                      <span className="hide-menu">{item.label}</span>
                    </Link>
                  ) : (
                    <>
                      <a className={`sidebar-link has-arrow ${childActive ? 'active' : ''}`} href="#" role="button" aria-haspopup="true" onClick={(e) => e.preventDefault()}>
                        <Icon name={item.icon} className="aside-icon" />
                        <span className="hide-menu">{item.label}</span>
                      </a>
                      <ul className="collapse first-level">
                        {item.children?.map((c) => (
                          <li key={c.to} className="sidebar-item">
                            <Link to={c.to} className={`sidebar-link ${c.to === pathname ? 'active' : ''}`} aria-current={c.to === pathname ? 'page' : undefined}>
                              <Icon name="circle" />
                              <span className="hide-menu">{c.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}
