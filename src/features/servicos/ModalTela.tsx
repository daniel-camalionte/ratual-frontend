import type { ReactNode } from 'react'
import BsModal from 'react-bootstrap/Modal'

/** Modal do módulo: tela cheia no celular, rodapé livre (botões grandes) e bloqueio enquanto envia. */
export function ModalTela({ title, subtitle, onClose, busy, footer, children }: {
  title: string
  subtitle?: string
  onClose: () => void
  busy?: boolean
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <BsModal show onHide={busy ? () => undefined : onClose} centered fullscreen="sm-down" scrollable backdrop={busy ? 'static' : true} className="sv-modal">
      <BsModal.Header closeButton={!busy}>
        <div className="min-w-0">
          <BsModal.Title as="h5" className="mb-0">
            {title}
          </BsModal.Title>
          {subtitle && <p className="text-muted small mb-0">{subtitle}</p>}
        </div>
      </BsModal.Header>
      <BsModal.Body>{children}</BsModal.Body>
      {footer && <BsModal.Footer className="sv-footer">{footer}</BsModal.Footer>}
    </BsModal>
  )
}

/** Botão de escolha (dia, horário, dia da semana) com alvo de toque grande. */
export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`sv-chip ${active ? 'is-active' : ''}`} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  )
}
