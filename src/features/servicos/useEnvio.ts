import { useState } from 'react'

/** Estado de envio comum: executa a chamada, captura a mensagem do backend (ex.: 409 de horário). */
export function useEnvio() {
  const [busy, setBusy] = useState(false)
  const [erro, setErro] = useState('')
  const run = async (fn: () => Promise<void>): Promise<boolean> => {
    setErro('')
    setBusy(true)
    try {
      await fn()
      return true
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível concluir.')
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, erro, setErro, run }
}
