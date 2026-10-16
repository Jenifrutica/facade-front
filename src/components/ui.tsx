import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react'

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bezel ${className}`}>
      <div className="bezel-core">{children}</div>
    </div>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: string
}

export function Field({ label, error, hint, id, ...props }: FieldProps) {
  const fieldId = id ?? props.name
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</span>
      <input
        id={fieldId}
        {...props}
        aria-invalid={Boolean(error)}
        className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-[15px] text-ink outline-none transition
          ${error ? 'border-danger/70' : 'border-hairline focus:border-gold/70'}
          focus:ring-2 focus:ring-gold/20`}
      />
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-danger"
          >
            <WarningCircle size={13} weight="light" /> {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  )
}

interface PasswordFieldProps extends FieldProps {
  strength?: number
}

export function PasswordField({ label, error, strength, id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const fieldId = id ?? props.name

  useEffect(() => {
    setVisible(false)
  }, [])

  return (
    <label htmlFor={fieldId} className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</span>
      <span className="relative block">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          {...props}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-xl border bg-surface-2 px-4 py-3 pr-12 text-[15px] text-ink outline-none transition
            ${error ? 'border-danger/70' : 'border-hairline focus:border-gold/70'}
            focus:ring-2 focus:ring-gold/20`}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted transition hover:text-gold"
        >
          {visible ? <EyeSlash size={19} weight="light" /> : <Eye size={19} weight="light" />}
        </button>
      </span>
      {typeof strength === 'number' && (
        <span className="flex gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                index < strength ? 'bg-gold' : 'bg-hairline'
              }`}
            />
          ))}
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1.5 text-xs text-danger">
          <WarningCircle size={13} weight="light" /> {error}
        </span>
      )}
    </label>
  )
}

interface ButtonProps {
  children: ReactNode
  type?: 'button' | 'submit'
  variant?: 'primary' | 'ghost' | 'quiet'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
}

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled,
  loading,
  onClick,
  className = '',
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[13px] font-medium uppercase tracking-[0.16em] transition disabled:opacity-50 active:translate-y-px'
  const styles = {
    primary: 'bg-gold text-abyss hover:bg-gold-soft',
    ghost: 'border border-hairline text-ink hover:border-gold/60 hover:text-gold',
    quiet: 'text-muted hover:text-gold',
  }[variant]

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${styles} ${className}`}
    >
      {loading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
