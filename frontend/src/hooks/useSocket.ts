import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { RoomState, TransferPayload, MintPayload } from '../types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

export function useSocket(roomCode: string | undefined, token: string | null) {
  const socketRef = useRef<Socket | null>(null)
  const [state, setState] = useState<RoomState | null>(null)
  const [connected, setConnected] = useState(false)
  const [socketError, setSocketError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode || !token) return

    const socket = io(BACKEND_URL, { 
      transports: ['websocket'],
      auth: { token }
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('JOIN_ROOM', roomCode)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('STATE_UPDATE', (newState: RoomState) => {
      setState(newState)
    })

    socket.on('ERROR', ({ message }: { message: string }) => {
      setSocketError(message)
      setTimeout(() => setSocketError(null), 4000)
    })

    return () => {
      socket.disconnect()
    }
  }, [roomCode, token])

  function transfer(payload: Omit<TransferPayload, 'roomCode'>) {
    socketRef.current?.emit('TRANSFER', { ...payload, roomCode })
  }

  function mint(payload: Omit<MintPayload, 'roomCode'>) {
    socketRef.current?.emit('MINT', { ...payload, roomCode })
  }

  return { state, setState, connected, socketError, transfer, mint }
}
