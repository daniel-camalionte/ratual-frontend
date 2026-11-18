export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="d-flex justify-content-center align-items-center p-5" role="status">
      <span className="spinner-border text-primary" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  )
}
