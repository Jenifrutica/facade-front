const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCOP(value: number): string {
  return cop.format(value)
}

export function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDaysISO(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const statusLabel: Record<string, string> = {
  CREATED: 'Reserva creada',
  CHECKED_IN: 'En hotel',
  CHECKED_OUT: 'Finalizada',
}

export const typeLabel: Record<string, string> = {
  SINGLE: 'Sencilla',
  DOUBLE: 'Doble',
  SUITE: 'Suite',
}
