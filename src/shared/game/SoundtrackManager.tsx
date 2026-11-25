import { useEffect, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useGamePreferences } from './preferences.ts'
import { SoundtrackContext } from './soundtrack-context.ts'

const MENU_TRACK_URL = '/audio/synapsis_racing_menu.webm'
const RACE_TRACK_URL = '/audio/synapsis_tema_de_carreras.webm'
const TARGET_VOLUME = 0.42
const FADE_DURATION_SEC = 1.2
const TICK_MS = 40

type TrackKey = 'menu' | 'race'

function createLoopingTrack(src: string): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  try {
    const audio = new Audio(src)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    return audio
  } catch {
    return null
  }
}

function safePlay(audio: HTMLAudioElement): Promise<boolean> {
  try {
    const result = audio.play()
    if (result && typeof result.then === 'function') {
      return result.then(
        () => true,
        () => false,
      )
    }
    return Promise.resolve(true)
  } catch {
    return Promise.resolve(false)
  }
}

function stepVolume(current: number, target: number, maxStep: number): number {
  const diff = target - current
  if (Math.abs(diff) <= maxStep) return target
  return current + Math.sign(diff) * maxStep
}

/**
 * Manages looping menu and race background music with smooth crossfading,
 * browser autoplay unlocking, tab-visibility pausing, and user preference sync.
 */
export function SoundtrackManager({ children }: PropsWithChildren) {
  const { preferences } = useGamePreferences()
  const [raceActive, setRaceActive] = useState(false)
  const [hidden, setHidden] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false,
  )
  const [unlocked, setUnlocked] = useState(false)

  const tracksRef = useRef<Record<TrackKey, HTMLAudioElement | null>>({
    menu: null,
    race: null,
  })

  const desiredTrack: TrackKey = raceActive ? 'race' : 'menu'

  const stateRef = useRef({
    desiredTrack,
    musicEnabled: preferences.music,
    hidden,
    unlocked,
  })
  stateRef.current = {
    desiredTrack,
    musicEnabled: preferences.music,
    hidden,
    unlocked,
  }

  useEffect(() => {
    const menu = createLoopingTrack(MENU_TRACK_URL)
    const race = createLoopingTrack(RACE_TRACK_URL)
    tracksRef.current = { menu, race }

    return () => {
      menu?.pause()
      race?.pause()
      tracksRef.current = { menu: null, race: null }
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (unlocked || typeof window === 'undefined') return

    const handleGesture = () => {
      const { desiredTrack: trackKey, musicEnabled, hidden: isHidden } =
        stateRef.current
      if (!musicEnabled || isHidden) {
        setUnlocked(true)
        return
      }
      const activeAudio = tracksRef.current[trackKey]
      if (!activeAudio) {
        setUnlocked(true)
        return
      }
      void safePlay(activeAudio).then((started) => {
        if (started) setUnlocked(true)
      })
    }

    window.addEventListener('pointerdown', handleGesture)
    window.addEventListener('keydown', handleGesture)
    return () => {
      window.removeEventListener('pointerdown', handleGesture)
      window.removeEventListener('keydown', handleGesture)
    }
  }, [unlocked])

  useEffect(() => {
    const maxStep = (TICK_MS / 1000 / FADE_DURATION_SEC) * TARGET_VOLUME

    const timer = window.setInterval(() => {
      const {
        desiredTrack: activeKey,
        musicEnabled,
        hidden: isHidden,
        unlocked: isUnlocked,
      } = stateRef.current
      const shouldPlay = musicEnabled && !isHidden && isUnlocked

      ;(['menu', 'race'] as const).forEach((key) => {
        const audio = tracksRef.current[key]
        if (!audio) return

        const target = shouldPlay && activeKey === key ? TARGET_VOLUME : 0
        if (target > 0 && audio.paused) {
          void safePlay(audio)
        }

        const nextVol = stepVolume(audio.volume, target, maxStep)
        audio.volume = Math.max(0, Math.min(1, nextVol))

        if (target === 0 && audio.volume <= 0.002 && !audio.paused) {
          audio.volume = 0
          audio.pause()
          try {
            audio.currentTime = 0
          } catch {
            /* Ignore if media is not seekable yet. */
          }
        }
      })
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <SoundtrackContext value={{ setRaceActive }}>
      {children}
    </SoundtrackContext>
  )
}
