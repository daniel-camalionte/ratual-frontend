interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  if (pageCount <= 1) return null
  const span = 2
  const pages: number[] = []
  for (let p = Math.max(1, page - span); p <= Math.min(pageCount, page + span); p++) pages.push(p)
  return (
    <nav aria-label="Paginação">
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Anterior">
            &laquo;
          </button>
        </li>
        {pages.map((p) => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button type="button" className="page-link" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}>
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${page === pageCount ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onChange(page + 1)} disabled={page === pageCount} aria-label="Próxima">
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  )
}
