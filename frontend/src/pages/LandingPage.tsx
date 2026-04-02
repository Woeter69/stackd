import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { safeJson } from '../utils'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [bankerName, setBankerName] = useState('')
  const [gameType, setGameType] = useState<'poker' | 'blackjack'>('poker')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ bankerName: bankerName.trim(), gameType }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      sessionStorage.setItem('playerId', data.banker.id)
      sessionStorage.setItem('playerRole', 'banker')
      navigate(`/room/${data.room.code}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create table')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          code: roomCode.trim().toUpperCase(),
          playerName: playerName.trim(),
        }),
      })
      const data = await safeJson(res)
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)

      sessionStorage.setItem('playerId', data.player.id)
      sessionStorage.setItem('playerRole', 'player')
      navigate(`/room/${data.room.code}`)
    } catch (err: any) {
      setError(err.message || 'Failed to join table')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 flex flex-col items-center justify-center p-4">
      {/* User Header */}
      {user && (
        <div className="absolute top-4 right-4 flex items-center gap-4 bg-[#1e293b] border border-[#334155] rounded-full px-4 py-2">
          <div className="flex flex-col text-right leading-tight">
            <span className="text-xs font-bold text-white">{user.username}</span>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Bankroll: ${user.balance.toLocaleString()}</span>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Stackd</h1>
          <p className="text-slate-400 text-sm">Virtual bankroll manager</p>
        </div>
      </div>

      <div className="max-w-md w-full">
        {/* Tabs */}
        <div className="flex bg-[#1e293b] p-1.5 rounded-2xl mb-8 border border-[#334155]">
          <button
            onClick={() => {
              setTab('create'); setError('');
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === 'create' ? 'bg-[#0f172a] text-emerald-400 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Create Table
          </button>
          <button
            onClick={() => {
              setTab('join'); setError('');
            }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${tab === 'join' ? 'bg-[#0f172a] text-emerald-400 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Join Table
          </button>
        </div>

        {/* Create Form */}
        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 space-y-5 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">New Table</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name (Banker)</label>
                <input
                  type="text"
                  required
                  value={bankerName}
                  onChange={(e) => setBankerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Game</label>
                <div className="flex bg-[#0f172a] border border-[#334155] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setGameType('poker')}
                    className={`flex-1 py-2 text-sm font-semibold transition-colors ${gameType === 'poker' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'}`}
                  >
                    Poker
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameType('blackjack')}
                    className={`flex-1 py-2 text-sm font-semibold border-l border-[#334155] transition-colors ${gameType === 'blackjack' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'}`}
                  >
                    Blackjack
                  </button>
                </div>
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !bankerName}
              className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold tracking-wide transition-all active:scale-[0.98]"
            >
              {loading ? 'Opening...' : 'Create Room'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 space-y-5 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Join Code</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Room Code</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono uppercase tracking-widest"
                  placeholder="e.g. A1B2C"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0f172a] border border-[#334155] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !roomCode || !playerName}
              className="w-full px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold tracking-wide transition-all active:scale-[0.98]"
            >
              {loading ? 'Joining...' : 'Enter Room'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
