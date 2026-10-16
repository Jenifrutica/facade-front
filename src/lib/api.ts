const BASE = import.meta.env.VITE_API_URL ?? ''

export type RoomType = 'SINGLE' | 'DOUBLE' | 'SUITE'
export type ExtraType = 'SPA' | 'BREAKFAST' | 'TRANSFER'
export type ReservationStatus = 'CREATED' | 'CHECKED_IN' | 'CHECKED_OUT'

export interface RoomView {
  id: string
  type: RoomType
  label: string
  basePrice: number
  nights: number
  season: string
  seasonMultiplier: number
  totalPrice: number
}

export interface ExtraServiceView {
  type: ExtraType
  label: string
  cost: number
}

export interface InvoiceLine {
  concept: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface InvoiceView {
  number: string
  issuedAt: string
  lines: InvoiceLine[]
  total: number
}

export interface ReservationView {
  id: string
  guestName: string
  guestEmail: string | null
  guestDocument: string | null
  roomId: string
  roomType: RoomType
  roomLabel: string
  checkIn: string
  checkOut: string
  nights: number
  season: string
  roomCharge: number
  extraServices: ExtraServiceView[]
  status: ReservationStatus
  accessKey: string | null
  invoice: InvoiceView | null
}

export interface UserView {
  id: string
  fullName: string
  email: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  user: UserView
}

export interface ReservationRequest {
  guestName: string
  guestEmail?: string
  guestDocument?: string
  roomType: RoomType
  checkIn: string
  checkOut: string
}

export class ApiError extends Error {
  status: number
  details: Record<string, string>

  constructor(status: number, message: string, details: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE}${path}`, { ...options, headers })
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = data?.message ?? 'Ocurrio un error inesperado'
    throw new ApiError(response.status, message, data?.details ?? {})
  }
  return data as T
}

export const api = {
  register: (body: { fullName: string; email: string; password: string; confirmPassword: string }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: (token: string) => request<UserView>('/api/auth/me', {}, token),

  availability: (type: RoomType | '', checkIn: string, checkOut: string) => {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    params.set('checkIn', checkIn)
    params.set('checkOut', checkOut)
    return request<RoomView[]>(`/api/hotel/disponibilidad?${params.toString()}`)
  },

  services: () => request<ExtraType[]>('/api/hotel/servicios'),

  reserve: (body: ReservationRequest, token: string) =>
    request<ReservationView>('/api/hotel/reservar', { method: 'POST', body: JSON.stringify(body) }, token),

  addService: (reservationId: string, type: ExtraType, token: string) =>
    request<ReservationView>(
      `/api/hotel/servicios/${reservationId}`,
      { method: 'POST', body: JSON.stringify({ type }) },
      token,
    ),

  checkIn: (reservationId: string, token: string) =>
    request<ReservationView>(`/api/hotel/checkin/${reservationId}`, { method: 'PUT' }, token),

  checkOut: (reservationId: string, token: string) =>
    request<ReservationView>(`/api/hotel/checkout/${reservationId}`, { method: 'PUT' }, token),

  getReservation: (reservationId: string, token: string) =>
    request<ReservationView>(`/api/hotel/reserva/${reservationId}`, {}, token),

  listReservations: (token: string) => request<ReservationView[]>('/api/hotel/reservas', {}, token),
}
