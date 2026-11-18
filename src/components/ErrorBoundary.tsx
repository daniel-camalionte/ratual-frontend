import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'

interface State {
  failed: boolean
}

/** Captura erros de renderizacao. Nunca exibe stack/mensagem interna ao usuario (evita vazar detalhes). */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <Alert tone="danger">
          Algo deu errado ao carregar esta tela.{' '}
          <button type="button" className="btn btn-link p-0 align-baseline" onClick={() => this.setState({ failed: false })}>
            Tentar novamente
          </button>
        </Alert>
      )
    }
    return this.props.children
  }
}
