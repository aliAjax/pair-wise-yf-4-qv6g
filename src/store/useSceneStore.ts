import { create } from 'zustand'
import type { WindowScene, SceneFormData, Journey, JourneyFormData } from '@/types'
import {
  migrateLegacyScenes,
  getValidScenes,
  getAllJourneys,
  saveJourney as storageSaveJourney,
  updateJourney as storageUpdateJourney,
  deleteJourney as storageDeleteJourney,
  saveScene as storageSaveScene,
  deleteScene as storageDeleteScene,
  getRandomScene,
} from '@/services/storage'

function sortJourneys(journeys: Journey[]): Journey[] {
  return [...journeys].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )
}

interface SceneState {
  scenes: WindowScene[]
  journeys: Journey[]
  activeJourney: Journey | null
  randomScene: WindowScene | null

  loadAll: () => void
  startJourney: (data: JourneyFormData) => void
  endJourney: () => void
  saveScene: (data: SceneFormData) => void
  deleteScene: (id: string) => void
  deleteJourney: (id: string) => void
  refreshRandom: () => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  journeys: [],
  activeJourney: null,
  randomScene: null,

  loadAll: () => {
    migrateLegacyScenes()
    const journeys = sortJourneys(getAllJourneys())
    const scenes = getValidScenes()
    const activeJourney = journeys.find((j) => j.endTime === null) ?? null
    set({ scenes, journeys, activeJourney })
  },

  startJourney: (data: JourneyFormData) => {
    if (get().activeJourney) return
    const journey: Journey = {
      id: crypto.randomUUID(),
      routeName: data.routeName,
      seatDirection: data.seatDirection,
      startTime: data.startTime,
      endTime: null,
      createdAt: new Date().toISOString(),
    }
    storageSaveJourney(journey)
    set((state) => ({
      journeys: sortJourneys([...state.journeys, journey]),
      activeJourney: journey,
    }))
  },

  endJourney: () => {
    const active = get().activeJourney
    if (!active) return
    const finished: Journey = { ...active, endTime: new Date().toISOString() }
    storageUpdateJourney(finished)
    set((state) => ({
      journeys: sortJourneys(state.journeys.map((j) => (j.id === finished.id ? finished : j))),
      activeJourney: null,
    }))
  },

  saveScene: (data: SceneFormData) => {
    const active = get().activeJourney
    if (!active) return
    const scene: WindowScene = {
      ...data,
      id: crypto.randomUUID(),
      journeyId: active.id,
      routeName: active.routeName,
      seatDirection: active.seatDirection,
      timestamp: new Date().toISOString(),
    }
    storageSaveScene(scene)
    set({ scenes: getValidScenes() })
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    set({ scenes: getValidScenes() })
  },

  deleteJourney: (id: string) => {
    storageDeleteJourney(id)
    const journeys = sortJourneys(getAllJourneys())
    set((state) => ({
      journeys,
      scenes: getValidScenes(),
      activeJourney: state.activeJourney?.id === id ? null : state.activeJourney,
    }))
  },

  refreshRandom: () => {
    const randomScene = getRandomScene()
    set({ randomScene })
  },
}))
