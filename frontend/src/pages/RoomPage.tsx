import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Copy, Check, Wifi, WifiOff, Crown, User2, Coins } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import Chip from '../components/Chip'
import { useAuth } from '../context/AuthContext'
import { CHIP_DENOMINATIONS, CHIP_COLORS, type ChipValue, type Player } from '../types'

export default function RoomPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { state, setState, connected, socketError, transfer, mint } = useSocket(code, token)

  // Our identity from sessionStorage
  const myId = sessionStorage.getItem('playerId') ?? ''
  const myRole = sessionStorage.getItem('playerRole') ?? 'player'

  // Load room state on mount via REST
  useEffect(() => {
    if (!code || !token) return
    fetch(`/api/rooms/${code}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((data) => setState(data))
      .catch(() => navigate('/'))
  }, [code, token])

  // Transfer builder state
  const [stack, setStack] = useState<Partial<Record<ChipValue, number>>>({})
  const [targetId, setTargetId] = useState<string>('POT')
  const [mintTargetId, setMintTargetId] = useState<string>('')
  const [mintAmount, setMintAmount] = useState<number>(100)
  const [copied, setCopied] = useState(false)

  const stackTotal = CHIP_DENOMINATIONS.reduce(
    (sum, denom) => sum + (stack[denom] ?? 0) * denom,
    0,
  )

  function addChip(denom: ChipValue) {
    setStack((prev) => ({ ...prev, [denom]: (prev[denom] ?? 0) + 1 }))
  }

  function removeChip(denom: ChipValue) {
    setStack((prev) => {
      const next = { ...prev }
      if ((next[denom] ?? 0) > 0) next[denom] = (next[denom] as number) - 1
      return next
    })
  }

  function clearStack() {
    setStack({})
  }

  function handleTransfer() {
    if (stackTotal <= 0 || !targetId) return
    transfer({ senderId: myId, receiverId: targetId, amount: stackTotal })
    clearStack()
  }

  function handleMint() {
    if (mintAmount <= 0 || !mintTargetId) return
    mint({ targetPlayerId: mintTargetId, amount: mintAmount })
  }

  // Effect to automatically select Dealer as target for Blackjack players
  useEffect(() => {
    if (state?.room?.gameType === 'blackjack' && targetId === 'POT') {
      const banker = state.players.find(p => p.role === 'banker')
      if (banker) setTargetId(banker.id)
    }
  }, [state?.room?.gameType, state?.players])

  function copyCode() {
    navigator.clipboard.writeText(code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const players = state?.players ?? []
  const pot = 0 // Pot = chips removed from players (not tracked as a player)
  const me = players.find((p) => p.id === myId)
  const others = players.filter((p) => p.id !== myId)

  const totalChips = players.reduce((sum, p) => sum + p.balance, 0)

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#1e293b]/90 backdrop-blur border-b border-[#334155] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f172a] border border-[#334155] hover:border-emerald-600 transition-colors group"
          >
            <span className="text-xs text-slate-400">Room</span>
            <span className="font-mono font-bold text-white tracking-widest">{code}</span>
            {copied
              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
              : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />}
          </button>
          {connected
            ? <Wifi className="w-4 h-4 text-emerald-400" />
            : <WifiOff className="w-4 h-4 text-slate-600 animate-pulse" />}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400">Total chips in play</span>
          <span className="text-lg font-bold text-emerald-400">${totalChips.toLocaleString()}</span>
        </div>
      </header>

      {/* Error toast */}
      {socketError && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-lg bg-red-900/60 border border-red-700 text-red-300 text-sm">
          ⚠️ {socketError}
        </div>
      )}

      {/* ── Player Grid ────────────────────────────────────────────────── */}
      <main className="flex-1 p-4 overflow-y-auto">
        {state?.room?.gameType === 'blackjack' && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Dealer</h2>
            {players.filter(p => p.role === 'banker').map(player => (
              <PlayerCard key={player.id} player={player} isMe={player.id === myId} />
            ))}
          </div>
        )}

        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          {state?.room?.gameType === 'blackjack' ? 'Players' : 'Players'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.filter(p => state?.room?.gameType === 'poker' || p.role !== 'banker').map((player) => (
            <PlayerCard key={player.id} player={player} isMe={player.id === myId} />
          ))}
        </div>

        {/* Banker Mint Panel */}
        {myRole === 'banker' && (
          <div className="mt-6 p-4 rounded-xl bg-[#1e293b] border border-amber-700/40">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Mint Chips
            </h3>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Player</label>
                <select
                  value={mintTargetId}
                  onChange={(e) => setMintTargetId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">Select player…</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Amount ($)</label>
                <input
                  type="number"
                  value={mintAmount}
                  min={1}
                  onChange={(e) => setMintAmount(Number(e.target.value))}
                  className="w-28 px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={handleMint}
                disabled={!mintTargetId || mintAmount <= 0}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm font-semibold text-white transition-colors"
              >
                Mint
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Action Bar ─────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-[#1e293b]/95 backdrop-blur border-t border-[#334155] p-4 space-y-3">
        {/* Chip Tray */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 mr-2">Tray</span>
          <div className="flex gap-2 flex-wrap">
            {CHIP_DENOMINATIONS.map((denom) => {
              const count = stack[denom] ?? 0
              return (
                <div key={denom} className="flex flex-col items-center gap-0.5">
                  <button
                    onClick={() => addChip(denom)}
                    className="active:scale-95 transition-transform"
                    title={`Add $${denom} chip`}
                  >
                    <Chip value={denom} colorClass={CHIP_COLORS[denom]} size={42} />
                  </button>
                  {count > 0 && (
                    <button
                      onClick={() => removeChip(denom)}
                      className="text-[10px] text-slate-400 hover:text-red-400 transition-colors leading-none"
                    >
                      ×{count}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Transfer Controls */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex-1 px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-sm text-white min-w-[100px]">
            Stack:{' '}
            <span className={stackTotal > 0 ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
              ${stackTotal.toLocaleString()}
            </span>
          </div>

          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[#0f172a] border border-[#334155] text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 min-w-[130px]"
          >
            {state?.room?.gameType !== 'blackjack' && <option value="POT">→ Pot</option>}
            {players
              .filter((p) => p.id !== myId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  → {p.role === 'banker' && state?.room?.gameType === 'blackjack' ? `Dealer (${p.name})` : p.name}
                </option>
              ))}
          </select>

          <button
            onClick={handleTransfer}
            disabled={stackTotal <= 0 || !me}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors whitespace-nowrap"
          >
            Send
          </button>

          {stackTotal > 0 && (
            <button
              onClick={clearStack}
              className="px-3 py-2 rounded-lg border border-[#334155] text-slate-400 hover:text-white text-sm transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: PlayerCard ─────────────────────────────────────────────────

function PlayerCard({ player, isMe }: { player: Player; isMe: boolean }) {
  return (
    <div
      className={`rounded-xl p-4 border flex flex-col gap-2 transition-all ${
        isMe
          ? 'bg-emerald-900/20 border-emerald-700/60'
          : 'bg-[#1e293b] border-[#334155] hover:border-slate-400/40'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {player.role === 'banker' ? (
            <Crown className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <User2 className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span className="text-xs text-slate-400 capitalize">{player.role}</span>
        </div>
        {isMe && (
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-900/40 px-1.5 py-0.5 rounded-full">
            you
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-white truncate">{player.name}</p>
      <p className="text-xl font-bold text-emerald-400 tabular-nums">
        ${player.balance.toLocaleString()}
      </p>
    </div>
  )
}
