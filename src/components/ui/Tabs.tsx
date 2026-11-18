import { useId, useState, type ReactNode } from 'react'

export interface TabItem {
  key: string
  label: string
  content: ReactNode
}

export function Tabs({ items }: { items: TabItem[] }) {
  const uid = useId()
  const [active, setActive] = useState(items[0]?.key)
  return (
    <div>
      <ul className="nav nav-tabs" role="tablist">
        {items.map((t) => (
          <li className="nav-item" role="presentation" key={t.key}>
            <button
              type="button"
              role="tab"
              id={`${uid}-tab-${t.key}`}
              aria-selected={active === t.key}
              aria-controls={`${uid}-panel-${t.key}`}
              className={`nav-link ${active === t.key ? 'active' : ''}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
      {items.map((t) =>
        active === t.key ? (
          <div key={t.key} role="tabpanel" id={`${uid}-panel-${t.key}`} aria-labelledby={`${uid}-tab-${t.key}`} className="pt-3">
            {t.content}
          </div>
        ) : null,
      )}
    </div>
  )
}
