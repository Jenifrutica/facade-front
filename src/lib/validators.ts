export type Validator = (value: string) => string | null

export const required =
  (message = 'Este campo es obligatorio'): Validator =>
  (value) =>
    value.trim().length === 0 ? message : null

export const minLength =
  (min: number, message?: string): Validator =>
  (value) =>
    value.length < min ? (message ?? `Minimo ${min} caracteres`) : null

export const maxLength =
  (max: number, message?: string): Validator =>
  (value) =>
    value.length > max ? (message ?? `Maximo ${max} caracteres`) : null

export const EMAIL_MAX = 254
export const PASSWORD_MAX = 72
export const NAME_MAX = 80

export const email = (): Validator => (value) => {
  if (value.length > EMAIL_MAX) return `Maximo ${EMAIL_MAX} caracteres`
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Correo electronico no valido'
}

/**
 * Strong password: at least 8 chars, one uppercase, one lowercase and one digit.
 * Mirrors the backend constraint so the user gets instant feedback.
 */
export const strongPassword = (): Validator => (value) => {
  if (value.length < 8) return 'Minimo 8 caracteres'
  if (!/[A-Z]/.test(value)) return 'Falta una letra mayuscula'
  if (!/[a-z]/.test(value)) return 'Falta una letra minuscula'
  if (!/[0-9]/.test(value)) return 'Falta un numero'
  return null
}

export const matches =
  (other: () => string, message = 'Las contrasenas no coinciden'): Validator =>
  (value) =>
    value === other() ? null : message

export function runValidators(value: string, validators: Validator[]): string | null {
  for (const validate of validators) {
    const error = validate(value)
    if (error) return error
  }
  return null
}

export function passwordStrength(value: string): { score: number; label: string } {
  let score = 0
  if (value.length >= 8) score++
  if (/[A-Z]/.test(value)) score++
  if (/[a-z]/.test(value)) score++
  if (/[0-9]/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const labels = ['Muy debil', 'Debil', 'Aceptable', 'Buena', 'Fuerte', 'Excelente']
  return { score, label: labels[Math.min(score, labels.length - 1)] }
}
