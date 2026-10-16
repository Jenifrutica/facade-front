import { AuthProvider, useAuth } from './lib/auth'
import { ToastProvider } from './components/Toast'
import { AuthView } from './views/AuthView'
import { BookingApp } from './views/BookingApp'

function Gate() {
  const { token, ready } = useAuth()

  if (!ready) {
    return (
      <div className="room-ground flex min-h-[100dvh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  return token ? <BookingApp /> : <AuthView />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Gate />
      </ToastProvider>
    </AuthProvider>
  )
}
