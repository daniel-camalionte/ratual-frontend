import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

export function ErroLista({ mensagem, onRetry }: { mensagem: string; onRetry: () => void }) {
  return (
    <>
      <Alert tone="danger">{mensagem}</Alert>
      <Button variant="primary" outline icon="refresh" onClick={onRetry}>
        Tentar novamente
      </Button>
    </>
  )
}
