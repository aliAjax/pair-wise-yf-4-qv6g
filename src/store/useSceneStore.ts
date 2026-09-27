import { create } from 'zustand'
import type { WindowScene, SceneFormData, Journey, JourneyFormData } from '@/types'
import {
  getValidScenes,
  getAllJourneys,
  getActiveJourney,
  createJourney as storageCreateJourney,
  endJourney as storageEndJourney,
  deleteJourney as storageDeleteJourney,
  saveScene as storageSaveScene,
  deleteScene as storageDeleteScene,
  getAllRouteNames,
  getRandomScene,
} from '@/services/storage'

interface SceneState {
  scenes: WindowScene[]
  journeys: Journey[]
  activeJourney: Journey | null
  routeNames: string[]
  selectedRoute: string
  randomScene: WindowScene | null

  loadAll: () => void
  createJourney: (data: JourneyFormData) => void
  endActiveJourney: () => void
  deleteJourney: (id: string) => void
  saveScene: (data: SceneFormData) => void
  deleteScene: (id: string) => void
  selectRoute: (routeName: string) => void
  refreshRandom: () => void
}

export const useSceneStore = create<SceneState>((set, get) => ({
  scenes: [],
  journeys: [],
  activeJourney: null,
  routeNames: [],
  selectedRoute: '',
  randomScene: null,

  loadAll: () => {
    set({
      scenes: getValidScenes(),
      journeys: getAllJourneys(),
      activeJourney: getActiveJourney(),
      routeNames: getAllRouteNames(),
    })
  },

  createJourney: (data: JourneyFormData) => {
    storageCreateJourney(data)
    get().loadAll()
  },

  endActiveJourney: () => {
    const active = get().activeJourney
    if (active) storageEndJourney(active.id)
    get().loadAll()
  },

  deleteJourney: (id: string) => {
    storageDeleteJourney(id)
    get().loadAll()
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
    get().loadAll()
  },

  deleteScene: (id: string) => {
    storageDeleteScene(id)
    get().loadAll()
  },

  selectRoute: (routeName: string) => {
    set({ selectedRoute: routeName })
  },

  refreshRandom: () => {
    set({ randomScene: getRandomScene() })
  },
}))
