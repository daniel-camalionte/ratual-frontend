import { useMemo, useState, type ReactNode } from 'react'
import { Pagination } from '@/components/ui/Pagination'
import { Icon } from '@/components/ui/Icon'

export interface Column<T> {
  key: string
  header: string
  /** valor usado para ordenar/filtrar; padrao: row[key] */
  value?: (row: T) => string | number
  render?: (row: T) => ReactNode
  sortable?: boolean
  align?: 'start' | 'end' | 'center'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  pageSize?: number
  searchable?: boolean
  caption?: string
  emptyMessage?: string
}

function cellValue<T>(col: Column<T>, row: T): string | number {
  if (col.value) return col.value(row)
  const v = (row as Record<string, unknown>)[col.key]
  return typeof v === 'number' ? v : String(v ?? '')
}

/** Tabela leve (sem jQuery): busca, ordenacao e paginacao no cliente. Para grandes volumes, pagine no backend. */
export function DataTable<T>({ columns, rows, rowKey, pageSize = 10, searchable = true, caption, emptyMessage = 'Nenhum registro encontrado.' }: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(1)

  const processed = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = q ? rows.filter((r) => columns.some((c) => String(cellValue(c, r)).toLowerCase().includes(q))) : rows
    if (sort) {
      const col = columns.find((c) => c.key === sort.key)
      if (col) {
        out = [...out].sort((a, b) => {
          const va = cellValue(col, a)
          const vb = cellValue(col, b)
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir
          return String(va).localeCompare(String(vb), 'pt-BR') * sort.dir
        })
      }
    }
    return out
  }, [rows, columns, query, sort])

  const pageCount = Math.max(1, Math.ceil(processed.length / pageSize))
  const current = Math.min(page, pageCount)
  const visible = processed.slice((current - 1) * pageSize, current * pageSize)

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }))

  return (
    <div>
      {searchable && (
        <div className="mb-3 rt-search">
          <input
            type="search"
            className="form-control"
            placeholder="Buscar..."
            aria-label="Buscar na tabela"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
          />
        </div>
      )}
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0 rt-stack">
          {caption && <caption className="visually-hidden">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => {
                const dir = sort?.key === c.key ? sort.dir : 0
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={`text-${c.align ?? 'start'}`}
                    aria-sort={dir === 1 ? 'ascending' : dir === -1 ? 'descending' : undefined}
                  >
                    {c.sortable ? (
                      <button type="button" className="btn btn-link p-0 text-decoration-none fw-semibold text-reset d-inline-flex align-items-center gap-1" onClick={() => toggleSort(c.key)}>
                        {c.header}
                        <Icon name={dir === 1 ? 'arrow-up' : dir === -1 ? 'arrow-down' : 'arrows-sort'} className="fs-4 opacity-75" />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center text-muted py-4">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((c) => (
                    <td key={c.key} data-label={c.header} className={`text-${c.align ?? 'start'}`}>
                      {c.render ? c.render(row) : cellValue(c, row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <small className="text-muted">
          {processed.length === 0 ? '0 registros' : `${(current - 1) * pageSize + 1}–${Math.min(current * pageSize, processed.length)} de ${processed.length}`}
        </small>
        <Pagination page={current} pageCount={pageCount} onChange={setPage} />
      </div>
    </div>
  )
}
