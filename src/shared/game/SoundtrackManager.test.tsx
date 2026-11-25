import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GamePreferences } from './GamePreferences.tsx'
import { SoundtrackManager } from './SoundtrackManager.tsx'
import { useSoundtrack } from './soundtrack-context.ts'

class MockAudio {
  static instances: MockAudio[] = []
  src: string
  loop = false
  preload = ''
  volume = 0
  paused = true
  currentTime = 0
  play = vi.fn(() => {
    this.paused = false
    return Promise.resolve()
  })
  pause = vi.fn(() => {
    this.paused = true
  })
  constructor(src: string) {
    this.src = src
    MockAudio.instances.push(this)
  }
}

function RaceTrigger() {
  const { setRaceActive } = useSoundtrack()
  return (
    <button type="button" onClick={() => setRaceActive(true)}>
      Start Race
    </button>
  )
}

describe('SoundtrackManager', () => {
  beforeEach(() => {
    MockAudio.instances = []
    vi.useFakeTimers()
    vi.stubGlobal('Audio', MockAudio)
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('plays menu music in a loop after user gesture and crossfades to race music when active', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <GamePreferences>
          <SoundtrackManager>
            <Routes>
              <Route path="/" element={<RaceTrigger />} />
            </Routes>
          </SoundtrackManager>
        </GamePreferences>
      </MemoryRouter>,
    )

    expect(MockAudio.instances).toHaveLength(2)
    const [menuAudio, raceAudio] = MockAudio.instances
    expect(menuAudio.src).toBe('/audio/synapsis_racing_menu.webm')
    expect(raceAudio.src).toBe('/audio/synapsis_tema_de_carreras.webm')
    expect(menuAudio.loop).toBe(true)
    expect(raceAudio.loop).toBe(true)

    // No playback before first user gesture
    expect(menuAudio.play).not.toHaveBeenCalled()

    // First user gesture unlocks menu track
    await act(async () => {
      fireEvent.pointerDown(window)
    })
    expect(menuAudio.play).toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(menuAudio.volume).toBeCloseTo(0.42, 2)
    expect(raceAudio.volume).toBe(0)

    // Switching to race crossfades to race theme
    await act(async () => {
      fireEvent.click(screen.getByText('Start Race'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(raceAudio.play).toHaveBeenCalled()
    expect(raceAudio.volume).toBeCloseTo(0.42, 2)
    expect(menuAudio.volume).toBe(0)
    expect(menuAudio.pause).toHaveBeenCalled()
  })

  it('keeps menu music on /training menu until training is actually started', async () => {
    render(
      <MemoryRouter initialEntries={['/training']}>
        <GamePreferences>
          <SoundtrackManager>
            <RaceTrigger />
          </SoundtrackManager>
        </GamePreferences>
      </MemoryRouter>,
    )

    const [menuAudio, raceAudio] = MockAudio.instances
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Enter' })
    })
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    // Still in training menu -> menu music plays, race music does not
    expect(menuAudio.play).toHaveBeenCalled()
    expect(menuAudio.volume).toBeCloseTo(0.42, 2)
    expect(raceAudio.play).not.toHaveBeenCalled()

    // Clicking Start Race -> crossfades to race music
    await act(async () => {
      fireEvent.click(screen.getByText('Start Race'))
    })
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(raceAudio.play).toHaveBeenCalled()
    expect(raceAudio.volume).toBeCloseTo(0.42, 2)
    expect(menuAudio.volume).toBe(0)
  })
})
