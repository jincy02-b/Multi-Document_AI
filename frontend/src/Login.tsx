import { useState, type FormEvent } from 'react'
import { login } from './api'
import { validateLogin } from './loginValidation'

export function Login({ onLoggedIn }: { onLoggedIn: (username: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const invalid = validateLogin(username, password)
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const session = await login(username.trim(), password)
      setPassword('')
      onLoggedIn(session.username)
    } catch (err) {
      setPassword('')
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Banking assessment · synthetic data only</p>
        <h1>Sign in</h1>
        <p>Use the workbench credentials from your local <code>.env</code> file. Passwords are not stored in the browser.</p>
      </header>
      <form className="panel login-form" onSubmit={(event) => void onSubmit(event)} autoComplete="on">
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          className="file"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={64}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          className="file"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p className="banner error">{error}</p> : null}
        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
