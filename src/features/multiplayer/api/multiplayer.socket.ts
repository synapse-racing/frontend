import { io, type Socket } from 'socket.io-client'
import { environment, resolveApiUrl } from '../../../shared/config/environment.ts'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../types/multiplayer.ts'

export type MultiplayerSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function connectMultiplayer(accessToken: string): MultiplayerSocket {
  const backendOrigin = resolveApiUrl(environment.apiUrl, new URL(window.location.href)).origin
  return io(`${backendOrigin}/multiplayer`, {
    auth: { token: accessToken },
    transports: ['websocket'],
  })
}
