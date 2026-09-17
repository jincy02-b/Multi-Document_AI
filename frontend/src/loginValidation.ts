export function validateLogin(username: string, password: string): string | null {
  const user = username.trim()
  if (user.length < 3 || user.length > 64) return 'Enter a valid username.'
  if (!/^[a-zA-Z0-9._-]+$/.test(user)) return 'Username may contain letters, numbers, dots, underscores, and hyphens.'
  if (password.length < 8 || password.length > 128) return 'Enter a valid password.'
  if (/[\u0000-\u001F]/.test(password)) return 'Enter a valid password.'
  return null
}
