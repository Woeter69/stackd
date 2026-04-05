/** Shared types between frontend and backend */

export interface Room {
  id: string
  code: string
  gameType: 'poker' | 'blackjack' | 'baccarat'
  pot: number
  createdAt: string
}

export interface Player {
  id: string
  roomId: string
  name: string
  role: 'banker' | 'player'
  balance: number
  createdAt: string
}

export interface RoomState {
  room: Room
  players: Player[]
}

export interface TransferPayload {
  roomCode: string
  senderId: string
  receiverId: string // player id or "POT"
  amount: number
}

export interface MintPayload {
  roomCode: string
  targetPlayerId: string
  amount: number
}

export const CHIP_DENOMINATIONS = [1, 5, 25, 100, 500] as const
export type ChipValue = (typeof CHIP_DENOMINATIONS)[number]

export const CHIP_COLORS: Record<ChipValue, string> = {
  1: 'text-slate-300',
  5: 'text-red-400',
  25: 'text-emerald-400',
  100: 'text-sky-400',
  500: 'text-purple-400',
}
