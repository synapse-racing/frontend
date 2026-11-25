import { createContext, useContext } from 'react'

export const SoundtrackContext = createContext({
  setRaceActive: (_active: boolean) => {},
})

/**
 * Allows race views (e.g. multiplayer race) to switch soundtrack from menu to race theme.
 */
export function useSoundtrack() {
  return useContext(SoundtrackContext)
}
