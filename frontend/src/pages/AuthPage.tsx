import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { safeJson } from '../utils'

export default function AuthPage() {
  const { login } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      login(data.token, data.user)
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight uppercase mb-2">
            STACKD
          </h1>
          <p className="text-emerald-400 font-medium tracking-widest text-xs uppercase">
            Global Casino Wallet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 space-y-5 shadow-2xl">
          <h2 className="text-xl font-bold text-white text-center">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
                placeholder="Unique player name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-shadow"
                placeholder="Your secret passphrase"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold tracking-wide transition-all active:scale-[0.98]"
          >
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Login'}
          </button>

          <div className="text-center pt-2 border-t border-[#334155]/50">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
