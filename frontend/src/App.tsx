import { useEffect, useState } from 'react'
import { currentUser, logout } from './api'
import { Login } from './Login'
import { Workbench } from './Workbench'

export function App() {
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    currentUser()
      .then((user) => {
        if (!cancelled) setUsername(user)
      })
      .catch(() => {
        if (!cancelled) setUsername(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onLogout() {
    await logout()
    setUsername(null)
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Checking session…</p>
      </div>
    )
  }

  if (!username) {
    return <Login onLoggedIn={setUsername} />
  }

  return <Workbench username={username} onLogout={() => void onLogout()} />
}
