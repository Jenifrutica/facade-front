import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import { Field, PasswordField } from '../components/ui'
import {
  email as emailValidator,
  matches,
  minLength,
  passwordStrength,
  required,
  runValidators,
  strongPassword,
} from '../lib/validators'

type Mode = 'login' | 'register'

interface Errors {
  fullName?: string | null
  email?: string | null
  password?: string | null
  confirmPassword?: string | null
}

const EASE = [0.16, 1, 0.3, 1] as const

export function AuthView() {
  const { signIn } = useAuth()
  const { notify } = useToast()
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [loading, setLoading] = useState(false)

  function validate(): boolean {
    const next: Errors = {
      email: runValidators(emailValue, [required('El correo es obligatorio'), emailValidator()]),
      password: runValidators(password, [
        required('La contrasena es obligatoria'),
        ...(mode === 'register' ? [strongPassword()] : []),
      ]),
    }
    if (mode === 'register') {
      next.fullName = runValidators(fullName, [required(), minLength(3, 'Minimo 3 caracteres')])
      next.confirmPassword = runValidators(confirmPassword, [
        required('Debes confirmar la contrasena'),
        matches(() => password),
      ])
    }
    setErrors(next)
    return Object.values(next).every((value) => !value)
  }

  async function submit() {
    if (!validate()) return
    setLoading(true)
    try {
      const response =
        mode === 'login'
          ? await api.login({ email: emailValue, password })
          : await api.register({ fullName, email: emailValue, password, confirmPassword })
      signIn(response)
      notify('success', `Bienvenido, ${response.user.fullName.split(' ')[0]}`)
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.details).length > 0) setErrors(error.details as Errors)
        notify('error', error.message)
      } else {
        notify('error', 'No se pudo conectar con el servidor')
      }
    } finally {
      setLoading(false)
    }
  }

  const { score } = passwordStrength(password)

  return (
    <div className="room-ground grain grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
      {/* Editorial split — left */}
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://picsum.photos/seed/aurum-marble-lobby/1700/2100"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'brightness(1.02) contrast(1.02) saturate(0.92)' }}
        />
        <div className="luxe-scrim absolute inset-0" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative flex h-full flex-col justify-between p-14 xl:p-20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.42em] text-gold">Est. 1927</span>
            <span className="text-[11px] uppercase tracking-[0.42em] text-ink/50">Reservas</span>
          </div>

          <div>
            <h1 className="wordmark font-display text-[clamp(5rem,11vw,10rem)] font-medium text-ink">
              Au<span className="italic text-gold">rum</span>
            </h1>
            <p className="mt-7 max-w-[38ch] text-[18px] leading-relaxed text-ink/65">
              Un hotel boutique donde la noche se sirve despacio. Reserva, personaliza y gestiona tu estancia
              en una sola pantalla.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] uppercase tracking-[0.2em] text-ink/45">
              <span>16 habitaciones</span>
              <span className="h-px w-8 bg-ink/20" />
              <span>3 categorias</span>
              <span className="h-px w-8 bg-ink/20" />
              <span>Temporada alta &times;1.5</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Form — right */}
      <section className="relative flex items-center justify-center overflow-hidden p-6 sm:p-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="aurora absolute -left-1/4 top-[-10%] h-[70vh] w-[70vh] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(138,103,22,0.22), transparent 60%)' }}
          />
          <div
            className="aurora absolute -right-1/3 bottom-[-15%] h-[65vh] w-[65vh] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(201,162,74,0.20), transparent 62%)',
              animationDelay: '-12s',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          className="relative w-full max-w-md"
        >
          <div className="mb-9 text-center lg:hidden">
            <h1 className="wordmark font-display text-6xl font-medium">
              Au<span className="italic text-gold">rum</span>
            </h1>
            <p className="mt-3 text-[11px] uppercase tracking-[0.32em] text-muted">Reservas de hotel</p>
          </div>

          <div className="bezel">
            <div className="bezel-core p-7 sm:p-9">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex gap-6">
                  {(['login', 'register'] as Mode[]).map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setMode(item)
                        setErrors({})
                      }}
                      className={`relative pb-2 text-[12px] uppercase tracking-[0.22em] transition ${
                        mode === item ? 'text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {item === 'login' ? 'Ingresar' : 'Crear cuenta'}
                      {mode === item && (
                        <motion.span layoutId="auth-underline" className="absolute inset-x-0 -bottom-px h-px bg-gold" />
                      )}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted">Aurum</span>
              </div>

              <form
                className="flex flex-col gap-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  submit()
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-5"
                  >
                    {mode === 'register' && (
                      <Field
                        label="Nombre completo"
                        name="fullName"
                        autoComplete="name"
                        placeholder="Jenifer Urbano"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        onBlur={() =>
                          setErrors((current) => ({
                            ...current,
                            fullName: runValidators(fullName, [required(), minLength(3, 'Minimo 3 caracteres')]),
                          }))
                        }
                        error={errors.fullName}
                      />
                    )}
                    <Field
                      label="Correo electronico"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={emailValue}
                      onChange={(event) => setEmailValue(event.target.value)}
                      onBlur={() =>
                        setErrors((current) => ({
                          ...current,
                          email: runValidators(emailValue, [required('El correo es obligatorio'), emailValidator()]),
                        }))
                      }
                      error={errors.email}
                    />
                    <PasswordField
                      label="Contrasena"
                      name="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() =>
                        setErrors((current) => ({
                          ...current,
                          password: runValidators(password, [
                            required('La contrasena es obligatoria'),
                            ...(mode === 'register' ? [strongPassword()] : []),
                          ]),
                        }))
                      }
                      error={errors.password}
                      strength={mode === 'register' ? score : undefined}
                    />
                    {mode === 'register' && (
                      <PasswordField
                        label="Confirmar contrasena"
                        name="confirmPassword"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        onBlur={() =>
                          setErrors((current) => ({
                            ...current,
                            confirmPassword: runValidators(confirmPassword, [
                              required('Debes confirmar la contrasena'),
                              matches(() => password),
                            ]),
                          }))
                        }
                        error={errors.confirmPassword}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="island group mt-1 flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.18em] text-white transition active:scale-[0.99] disabled:opacity-60"
                >
                  {loading && (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  )}
                  {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                    <ArrowUpRight size={13} weight="light" />
                  </span>
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-muted">
                Las contrasenas se almacenan encriptadas con BCrypt.
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
