import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/Toast'
import { Button, Field, PasswordField } from '../components/ui'
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
          : await api.register({
              fullName,
              email: emailValue,
              password,
              confirmPassword,
            })
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
    <div className="room-ground grain grid min-h-[100dvh] grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          src="https://picsum.photos/seed/aurum-hotel-dusk/1600/2000"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          style={{ filter: 'brightness(0.97) contrast(1.03) saturate(0.95)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/75 to-abyss/25" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <span className="text-[11px] uppercase tracking-[0.35em] text-gold">Est. 1927 · Reservas</span>
          <div>
            <h1 className="font-display text-[clamp(4rem,9vw,8rem)] font-medium leading-[0.9] tracking-[-0.02em] text-ink">
              Au<span className="italic text-gold">rum</span>
            </h1>
            <p className="mt-6 max-w-[34ch] text-[17px] leading-relaxed text-ink/70">
              Un hotel boutique donde la noche se sirve despacio. Reserva, personaliza y gestiona tu estancia.
            </p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:hidden">
            <h1 className="font-display text-5xl font-medium tracking-[-0.02em]">
              Au<span className="italic text-gold">rum</span>
            </h1>
          </div>

          <div className="bezel">
            <div className="bezel-core p-7 sm:p-9">
              <div className="mb-7 flex gap-6">
                {(['login', 'register'] as Mode[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setMode(item)
                      setErrors({})
                    }}
                    className={`relative pb-2 text-[13px] uppercase tracking-[0.2em] transition ${
                      mode === item ? 'text-gold' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {item === 'login' ? 'Ingresar' : 'Crear cuenta'}
                    {mode === item && (
                      <motion.span
                        layoutId="auth-underline"
                        className="absolute inset-x-0 -bottom-px h-px bg-gold"
                      />
                    )}
                  </button>
                ))}
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

                <Button type="submit" loading={loading} className="mt-1 w-full">
                  {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
                </Button>
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
