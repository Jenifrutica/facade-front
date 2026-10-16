import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowLeft,
  Bed,
  CalendarBlank,
  CheckCircle,
  Key,
  SignOut,
  Sparkle,
  Tag,
  Door,
  ClockCounterClockwise,
} from '@phosphor-icons/react'
import { api, ApiError } from '../lib/api'
import type { ExtraType, ReservationView, RoomType, RoomView } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import { Button, Field, Panel } from '../components/ui'
import { addDaysISO, formatCOP, formatDate, maxBookingISO, statusLabel, todayISO, typeLabel } from '../lib/format'

type Step = 'search' | 'guest' | 'manage' | 'history'

const roomImage: Record<RoomType, string> = {
  SINGLE: '/rooms-single.jpg',
  DOUBLE: '/rooms-double.jpg',
  SUITE: '/rooms-suite.jpg',
}

const serviceInfo: Record<ExtraType, { label: string; note: string }> = {
  SPA: { label: 'Spa', note: 'Sesion de spa · cargo unico' },
  BREAKFAST: { label: 'Desayuno', note: 'Por cada noche de estancia' },
  TRANSFER: { label: 'Traslado', note: 'Recogida privada · cargo unico' },
}

export function BookingApp() {
  const { user, token, signOut } = useAuth()
  const { notify } = useToast()

  const [step, setStep] = useState<Step>('search')
  const [checkIn, setCheckIn] = useState(todayISO())
  const [checkOut, setCheckOut] = useState(addDaysISO(todayISO(), 2))
  const maxDate = maxBookingISO()
  const [typeFilter, setTypeFilter] = useState<RoomType | ''>('')
  const [rooms, setRooms] = useState<RoomView[]>([])
  const [searching, setSearching] = useState(false)
  const [reservation, setReservation] = useState<ReservationView | null>(null)
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<ReservationView[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  async function openHistory() {
    if (!token) return
    setStep('history')
    setLoadingHistory(true)
    try {
      setHistory(await api.listReservations(token))
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'No se pudieron cargar las reservas')
    } finally {
      setLoadingHistory(false)
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<RoomType, { count: number; sample: RoomView }>()
    for (const room of rooms) {
      const entry = map.get(room.type)
      if (entry) entry.count += 1
      else map.set(room.type, { count: 1, sample: room })
    }
    return [...map.entries()]
  }, [rooms])

  async function search() {
    if (new Date(checkOut) <= new Date(checkIn)) {
      notify('error', 'La salida debe ser posterior a la entrada')
      return
    }
    setSearching(true)
    try {
      const result = await api.availability(typeFilter, checkIn, checkOut)
      setRooms(result)
      if (result.length === 0) notify('info', 'No hay habitaciones para esas fechas')
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Error al buscar')
    } finally {
      setSearching(false)
    }
  }

  async function addService(type: ExtraType) {
    if (!reservation || !token) return
    try {
      const updated = await api.addService(reservation.id, type, token)
      setReservation(updated)
      notify('success', `Servicio agregado: ${serviceInfo[type].label}`)
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'No se pudo agregar')
    }
  }

  async function lifecycle(action: 'checkIn' | 'checkOut') {
    if (!reservation || !token) return
    setBusy(true)
    try {
      const updated = action === 'checkIn' ? await api.checkIn(reservation.id, token) : await api.checkOut(reservation.id, token)
      setReservation(updated)
      notify('success', action === 'checkIn' ? 'Check-in realizado, llave emitida' : 'Check-out realizado')
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'No se pudo completar')
    } finally {
      setBusy(false)
    }
  }

  function startOver() {
    setReservation(null)
    setStep('search')
    setRooms([])
  }

  return (
    <div className="room-ground grain min-h-[100dvh]">
      <Header name={user?.fullName ?? ''} onSignOut={signOut} onHistory={openHistory} />

      <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">
        <AnimatePresence mode="wait">
          {step === 'search' && (
            <SearchStep
              key="search"
              checkIn={checkIn}
              checkOut={checkOut}
              maxDate={maxDate}
              typeFilter={typeFilter}
              searching={searching}
              grouped={grouped}
              hasSearched={rooms.length > 0}
              onCheckIn={(value) => {
                setCheckIn(value)
                if (checkOut <= value) setCheckOut(addDaysISO(value, 1))
                else if (checkOut > maxDate) setCheckOut(maxDate)
              }}
              onCheckOut={(value) => setCheckOut(value > maxDate ? maxDate : value)}
              onType={setTypeFilter}
              onSearch={search}
              onSelect={(type) => {
                setTypeFilter(type)
                setStep('guest')
              }}
            />
          )}

          {step === 'guest' && (
            <GuestStep
              key="guest"
              roomType={typeFilter as RoomType}
              checkIn={checkIn}
              checkOut={checkOut}
              onBack={() => setStep('search')}
              onCreated={(created) => {
                setReservation(created)
                setStep('manage')
              }}
            />
          )}

          {step === 'manage' && reservation && (
            <ManageStep
              key="manage"
              reservation={reservation}
              busy={busy}
              onAddService={addService}
              onLifecycle={lifecycle}
              onStartOver={startOver}
            />
          )}

          {step === 'history' && (
            <HistoryStep
              key="history"
              loading={loadingHistory}
              reservations={history}
              onBack={() => setStep(reservation ? 'manage' : 'search')}
              onOpen={(selected) => {
                setReservation(selected)
                setStep('manage')
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function Header({
  name,
  onSignOut,
  onHistory,
}: {
  name: string
  onSignOut: () => void
  onHistory: () => void
}) {
  return (
    <header className="sticky top-0 z-40">
      <div className="glass mx-auto mt-4 flex w-[min(96vw,1180px)] items-center justify-between rounded-full border border-hairline px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-medium tracking-[-0.02em]">
            Au<span className="italic text-gold">rum</span>
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.28em] text-muted sm:inline">
            Reservas de Hotel
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onHistory}
            className="flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-muted transition hover:border-gold/60 hover:text-gold"
          >
            <ClockCounterClockwise size={15} weight="light" /> Mis reservas
          </button>
          <span className="hidden text-sm text-ink/70 sm:inline">{name}</span>
          <button
            onClick={onSignOut}
            aria-label="Cerrar sesion"
            className="flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-muted transition hover:border-gold/60 hover:text-gold"
          >
            <SignOut size={15} weight="light" /> Salir
          </button>
        </div>
      </div>
    </header>
  )
}

interface SearchProps {
  checkIn: string
  checkOut: string
  maxDate: string
  typeFilter: RoomType | ''
  searching: boolean
  grouped: [RoomType, { count: number; sample: RoomView }][]
  hasSearched: boolean
  onCheckIn: (value: string) => void
  onCheckOut: (value: string) => void
  onType: (value: RoomType | '') => void
  onSearch: () => void
  onSelect: (type: RoomType) => void
}

function SearchStep({
  checkIn,
  checkOut,
  maxDate,
  typeFilter,
  searching,
  grouped,
  hasSearched,
  onCheckIn,
  onCheckOut,
  onType,
  onSearch,
  onSelect,
}: SearchProps) {
  const types: (RoomType | '')[] = ['', 'SINGLE', 'DOUBLE', 'SUITE']
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-10 max-w-[22ch]">
        <span className="text-[11px] uppercase tracking-[0.28em] text-gold">Disponibilidad</span>
        <h1 className="mt-3 font-display text-[clamp(2.6rem,6vw,4.6rem)] font-medium leading-[0.95] tracking-[-0.02em]">
          Encuentra tu habitacion
        </h1>
      </div>

      <Panel>
        <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
          <DateField label="Entrada" value={checkIn} min={todayISO()} max={maxDate} onChange={onCheckIn} />
          <DateField label="Salida" value={checkOut} min={checkIn} max={maxDate} onChange={onCheckOut} />
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Tipo</span>
            <div className="flex gap-2">
              {types.map((type) => (
                <button
                  key={type || 'all'}
                  onClick={() => onType(type)}
                  className={`rounded-full border px-3 py-2 text-xs transition ${
                    typeFilter === type
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-hairline text-muted hover:text-ink'
                  }`}
                >
                  {type ? typeLabel[type] : 'Todas'}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={onSearch} loading={searching} className="h-[46px]">
            Buscar
          </Button>
        </div>
      </Panel>

      <div className="mt-12">
        {!hasSearched && (
          <p className="text-sm text-muted">
            Elige tus fechas y pulsa buscar para ver las habitaciones y su precio segun temporada.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {grouped.map(([type, info], index) => (
              <motion.button
                key={type}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => onSelect(type)}
                className="group bezel text-left"
              >
                <div className="bezel-core overflow-hidden">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={roomImage[type]}
                      alt=""
                      className="h-full w-full object-cover transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      style={{ filter: 'brightness(0.98) contrast(1.02) saturate(1.02)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-abyss/75 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full border border-gold/40 bg-abyss/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-gold backdrop-blur">
                      {info.sample.season === 'Alta' ? 'Temporada alta ×1.5' : 'Temporada baja'}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-display text-2xl">
                        <Bed size={20} weight="light" className="text-gold" /> {typeLabel[type]}
                      </h3>
                      <span className="text-xs text-muted">
                        {info.count} {info.count === 1 ? 'disponible' : 'disponibles'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      {info.sample.nights} {info.sample.nights === 1 ? 'noche' : 'noches'} · base{' '}
                      {formatCOP(info.sample.basePrice)} / noche
                    </p>
                    <div className="mt-4 flex items-end justify-between border-t border-hairline pt-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Total</span>
                        <p className="font-display text-3xl text-gold">{formatCOP(info.sample.totalPrice)}</p>
                      </div>
                      <span className="text-[12px] uppercase tracking-[0.16em] text-ink/70 transition group-hover:text-gold">
                        Reservar
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  )
}

function DateField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: string
  min: string
  max: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted">
        <CalendarBlank size={13} weight="light" /> {label}
      </span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-hairline bg-surface-2 px-4 py-3 text-[15px] text-ink outline-none transition focus:border-gold/70 focus:ring-2 focus:ring-gold/20"
      />
    </label>
  )
}

function GuestStep({
  roomType,
  checkIn,
  checkOut,
  onBack,
  onCreated,
}: {
  roomType: RoomType
  checkIn: string
  checkOut: string
  onBack: () => void
  onCreated: (reservation: ReservationView) => void
}) {
  const { token } = useAuth()
  const { notify } = useToast()
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestDocument, setGuestDocument] = useState('')
  const [errors, setErrors] = useState<{ guestName?: string | null; guestEmail?: string | null }>({})
  const [loading, setLoading] = useState(false)

  async function submit() {
    const next = {
      guestName:
        guestName.trim().length < 3
          ? 'Ingresa el nombre completo (min. 3)'
          : guestName.length > 80
            ? 'Maximo 80 caracteres'
            : null,
      guestEmail:
        guestEmail.length > 254
          ? 'Maximo 254 caracteres'
          : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
            ? null
            : 'Correo no valido',
    }
    setErrors(next)
    if (next.guestName || next.guestEmail || !token) return
    setLoading(true)
    try {
      const created = await api.reserve(
        { guestName, guestEmail, guestDocument, roomType, checkIn, checkOut },
        token,
      )
      notify('success', `Reserva creada · Habitacion ${created.roomId}`)
      onCreated(created)
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'No se pudo reservar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-10 lg:grid-cols-[1fr_420px]"
    >
      <div>
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-muted transition hover:text-gold"
        >
          <ArrowLeft size={15} weight="light" /> Volver
        </button>
        <span className="text-[11px] uppercase tracking-[0.28em] text-gold">Paso 2</span>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-medium leading-[1] tracking-[-0.02em]">
          Datos del huesped
        </h1>
        <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">
          Completa tus datos para confirmar la reserva. Todos los campos se validan antes de enviar.
        </p>

        <form
          className="mt-8 flex max-w-lg flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <Field
            label="Nombre completo"
            value={guestName}
            maxLength={80}
            onChange={(event) => setGuestName(event.target.value)}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                guestName:
                  guestName.trim().length < 3
                    ? 'Ingresa el nombre completo (min. 3)'
                    : guestName.length > 80
                      ? 'Maximo 80 caracteres'
                      : null,
              }))
            }
            error={errors.guestName}
            placeholder="Ana Torres"
          />
          <Field
            label="Correo electronico"
            type="email"
            value={guestEmail}
            maxLength={254}
            onChange={(event) => setGuestEmail(event.target.value)}
            onBlur={() =>
              setErrors((current) => ({
                ...current,
                guestEmail:
                  guestEmail.length > 254
                    ? 'Maximo 254 caracteres'
                    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
                      ? null
                      : 'Correo no valido',
              }))
            }
            error={errors.guestEmail}
            placeholder="ana@correo.com"
          />
          <Field
            label="Documento (opcional)"
            value={guestDocument}
            maxLength={30}
            onChange={(event) => setGuestDocument(event.target.value)}
            placeholder="10203040"
          />
          <div className="mt-2">
            <Button type="submit" loading={loading}>
              Confirmar reserva
            </Button>
          </div>
        </form>
      </div>

      <Panel className="self-start">
        <div className="p-6">
          <h3 className="font-display text-2xl">{typeLabel[roomType]}</h3>
          <p className="mt-1 text-sm text-muted">Resumen de tu seleccion</p>
          <dl className="mt-6 flex flex-col gap-4 text-sm">
            <Row icon={<CalendarBlank size={15} weight="light" />} label="Entrada" value={formatDate(checkIn)} />
            <Row icon={<CalendarBlank size={15} weight="light" />} label="Salida" value={formatDate(checkOut)} />
            <Row icon={<Door size={15} weight="light" />} label="Habitacion" value={typeLabel[roomType]} />
          </dl>
          <p className="mt-6 border-t border-hairline pt-4 text-xs text-muted">
            El precio final se calcula en el servidor segun temporada y servicios adicionales.
          </p>
        </div>
      </Panel>
    </motion.section>
  )
}

function HistoryStep({
  loading,
  reservations,
  onBack,
  onOpen,
}: {
  loading: boolean
  reservations: ReservationView[]
  onBack: () => void
  onOpen: (reservation: ReservationView) => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-muted transition hover:text-gold"
      >
        <ArrowLeft size={15} weight="light" /> Volver
      </button>
      <span className="text-[11px] uppercase tracking-[0.28em] text-gold">Historial</span>
      <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-medium leading-[1] tracking-[-0.02em]">
        Mis reservas
      </h1>

      {loading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-busy>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="bezel">
              <div className="bezel-core h-28 animate-pulse bg-surface-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && reservations.length === 0 && (
        <p className="mt-8 text-sm text-muted">Aun no tienes reservas registradas.</p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {reservations.map((item) => (
          <button key={item.id} onClick={() => onOpen(item)} className="bezel text-left transition hover:border-gold/40">
            <div className="bezel-core flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="font-display text-xl">Habitacion {item.roomId}</span>
                <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-gold">
                  {statusLabel[item.status]}
                </span>
              </div>
              <p className="text-sm text-muted">
                {item.guestName} · {formatDate(item.checkIn)} — {formatDate(item.checkOut)}
              </p>
              <p className="text-sm text-ink/80">{formatCOP(item.roomCharge)}</p>
            </div>
          </button>
        ))}
      </div>
    </motion.section>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="flex items-center gap-2 text-muted">
        {icon}
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  )
}

function ManageStep({
  reservation,
  busy,
  onAddService,
  onLifecycle,
  onStartOver,
}: {
  reservation: ReservationView
  busy: boolean
  onAddService: (type: ExtraType) => void
  onLifecycle: (action: 'checkIn' | 'checkOut') => void
  onStartOver: () => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.28em] text-gold">Gestion de reserva</span>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-medium leading-[1] tracking-[-0.02em]">
            Habitacion {reservation.roomId}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {reservation.guestName} · {formatDate(reservation.checkIn)} — {formatDate(reservation.checkOut)}
          </p>
        </div>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-[12px] uppercase tracking-[0.16em] text-gold">
          {statusLabel[reservation.status]}
        </span>
      </div>

      {reservation.accessKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 flex items-center gap-4 rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4"
        >
          <Key size={22} weight="light" className="text-gold" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Llave digital</p>
            <p className="font-mono text-sm text-ink">{reservation.accessKey}</p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl">
              <Sparkle size={20} weight="light" className="text-gold" /> Servicios adicionales
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {(Object.keys(serviceInfo) as ExtraType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onAddService(type)}
                  disabled={reservation.status === 'CHECKED_OUT'}
                  className="bezel text-left transition hover:border-gold/40 disabled:opacity-50"
                >
                  <div className="bezel-core p-5">
                    <p className="font-display text-xl">{serviceInfo[type].label}</p>
                    <p className="mt-1 text-xs text-muted">{serviceInfo[type].note}</p>
                    <p className="mt-4 flex items-center gap-1 text-sm text-gold">
                      <Tag size={14} weight="light" /> Agregar
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {reservation.invoice && (
            <div>
              <h2 className="mb-4 font-display text-2xl">Factura final</h2>
              <Panel>
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between text-xs text-muted">
                    <span>{reservation.invoice.number}</span>
                    <span>{new Date(reservation.invoice.issuedAt).toLocaleString('es-CO')}</span>
                  </div>
                  <ul className="divide-y divide-hairline">
                    {reservation.invoice.lines.map((line, index) => (
                      <li key={index} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <span className="text-ink/85">
                          {line.concept}
                          {line.quantity > 1 && <span className="text-muted"> ×{line.quantity}</span>}
                        </span>
                        <span className="tabular-nums text-ink">{formatCOP(line.subtotal)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Total</span>
                    <span className="font-display text-3xl text-gold">{formatCOP(reservation.invoice.total)}</span>
                  </div>
                </div>
              </Panel>
            </div>
          )}
        </div>

        <Panel className="self-start">
          <div className="p-6">
            <h3 className="font-display text-2xl">Resumen</h3>
            <dl className="mt-5 flex flex-col gap-4 text-sm">
              <Row icon={<Door size={15} weight="light" />} label="Habitacion" value={reservation.roomLabel} />
              <Row icon={<CalendarBlank size={15} weight="light" />} label="Noches" value={String(reservation.nights)} />
              <Row icon={<Tag size={15} weight="light" />} label="Temporada" value={reservation.season} />
              <Row
                icon={<Bed size={15} weight="light" />}
                label="Habitacion"
                value={formatCOP(reservation.roomCharge)}
              />
            </dl>

            {reservation.extraServices.length > 0 && (
              <div className="mt-5 border-t border-hairline pt-4">
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-muted">Servicios</p>
                <ul className="flex flex-col gap-2 text-sm">
                  {reservation.extraServices.map((service, index) => (
                    <li key={index} className="flex justify-between">
                      <span className="text-ink/85">{service.label}</span>
                      <span className="tabular-nums text-muted">{formatCOP(service.cost)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              {reservation.status === 'CREATED' && (
                <Button onClick={() => onLifecycle('checkIn')} loading={busy}>
                  <CheckCircle size={16} weight="light" /> Check-in
                </Button>
              )}
              {reservation.status === 'CHECKED_IN' && (
                <Button onClick={() => onLifecycle('checkOut')} loading={busy}>
                  Check-out y facturar
                </Button>
              )}
              <Button variant="ghost" onClick={onStartOver}>
                Nueva reserva
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </motion.section>
  )
}
