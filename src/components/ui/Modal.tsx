import type { ReactNode } from 'react'
import BsModal from 'react-bootstrap/Modal'
import { Button } from './Button'

interface ModalProps {
  show: boolean
  title: string
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
  confirmVariant?: 'primary' | 'danger' | 'success'
  loading?: boolean
  children: ReactNode
}

export function Modal({ show, title, onClose, onConfirm, confirmLabel = 'Confirmar', confirmVariant = 'primary', loading, children }: ModalProps) {
  return (
    <BsModal show={show} onHide={onClose} centered fullscreen="sm-down" scrollable>
      <BsModal.Header closeButton>
        <BsModal.Title as="h5">{title}</BsModal.Title>
      </BsModal.Header>
      <BsModal.Body>{children}</BsModal.Body>
      <BsModal.Footer>
        <Button variant="light" onClick={onClose}>
          Cancelar
        </Button>
        {onConfirm && (
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        )}
      </BsModal.Footer>
    </BsModal>
  )
}
