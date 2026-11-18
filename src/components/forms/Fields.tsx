import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

/**
 * Campos prontos para react-hook-form: `<TextField label="Nome" {...register('nome')} error={errors.nome?.message} />`.
 * Cada campo liga label, erro e hint por id (acessibilidade) e nunca renderiza HTML cru.
 */

interface BaseProps {
  label: string
  error?: string
  hint?: string
}

function Wrapper({ id, label, error, hint, children }: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
      {hint && !error && (
        <div id={`${id}-hint`} className="form-text">
          {hint}
        </div>
      )}
      {error && (
        <div id={`${id}-error`} className="invalid-feedback d-block" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

const describedBy = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

export const TextField = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(function TextField(
  { label, error, hint, className = '', ...rest },
  ref,
) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        ref={ref}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </Wrapper>
  )
})

export const TextAreaField = forwardRef<HTMLTextAreaElement, BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextAreaField(
  { label, error, hint, className = '', rows = 4, ...rest },
  ref,
) {
  const id = useId()
  return (
    <Wrapper id={id} label={label} error={error} hint={hint}>
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...rest}
      />
    </Wrapper>
  )
})

export interface Option {
  value: string
  label: string
}

export const SelectField = forwardRef<HTMLSelectElement, BaseProps & SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }>(
  function SelectField({ label, error, hint, options, placeholder, className = '', ...rest }, ref) {
    const id = useId()
    return (
      <Wrapper id={id} label={label} error={error} hint={hint}>
        <select
          id={id}
          ref={ref}
          className={`form-select ${error ? 'is-invalid' : ''} ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Wrapper>
    )
  },
)

interface CheckProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  kind?: 'checkbox' | 'radio' | 'switch'
}

export const CheckField = forwardRef<HTMLInputElement, CheckProps>(function CheckField({ label, error, kind = 'checkbox', ...rest }, ref) {
  const id = useId()
  return (
    <div className={`form-check mb-2 ${kind === 'switch' ? 'form-switch' : ''}`}>
      <input
        id={id}
        ref={ref}
        type={kind === 'radio' ? 'radio' : 'checkbox'}
        role={kind === 'switch' ? 'switch' : undefined}
        className={`form-check-input ${error ? 'is-invalid' : ''}`}
        {...rest}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
      {error && (
        <div className="invalid-feedback d-block" role="alert">
          {error}
        </div>
      )}
    </div>
  )
})
