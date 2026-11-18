import { Link, useLocation } from 'react-router-dom'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { useNavItems } from '@/config/useNavItems'
import { Icon } from '@/components/ui/Icon'

export function MobileNav({ show, onHide }: { show: boolean; onHide: () => void }) {
  const { pathname } = useLocation()
  const items = useNavItems()
  return (
    <Offcanvas show={show} onHide={onHide} placement="start" aria-labelledby="mobile-nav-title">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title id="mobile-nav-title">Menu</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <nav aria-label="Menu principal (mobile)">
          <ul className="list-unstyled mb-0">
            {items.map((item) => (
              <li key={item.label} className="mb-2">
                {item.to ? (
                  <Link to={item.to} onClick={onHide} className={`d-flex align-items-center gap-2 py-3 text-decoration-none ${item.to === pathname ? 'text-primary fw-semibold' : 'text-body'}`}>
                    <Icon name={item.icon} /> {item.label}
                  </Link>
                ) : (
                  <>
                    <div className="d-flex align-items-center gap-2 py-2 fw-semibold">
                      <Icon name={item.icon} /> {item.label}
                    </div>
                    <ul className="list-unstyled ps-4">
                      {item.children?.map((c) => (
                        <li key={c.to}>
                          <Link to={c.to} onClick={onHide} className={`d-block py-2 text-decoration-none ${c.to === pathname ? 'text-primary fw-semibold' : 'text-body'}`}>
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </Offcanvas.Body>
    </Offcanvas>
  )
}
