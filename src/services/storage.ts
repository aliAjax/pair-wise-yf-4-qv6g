import type { WindowScene, Journey } from '@/types'

const SCENES_KEY = 'bus_window_scenes'
const JOURNEYS_KEY = 'bus_window_journeys'

export const UNFILED_JOURNEY_NAME = '未归档行程'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getAllScenes(): WindowScene[] {
  return readJson<WindowScene[]>(SCENES_KEY, [])
}

export function getAllJourneys(): Journey[] {
  return readJson<Journey[]>(JOURNEYS_KEY, [])
}

function persistScenes(scenes: WindowScene[]): void {
  localStorage.setItem(SCENES_KEY, JSON.stringify(scenes))
}

function persistJourneys(journeys: Journey[]): void {
  localStorage.setItem(JOURNEYS_KEY, JSON.stringify(journeys))
}

// 旧版本保存的窗景没有 journeyId，迁移时归入"未归档行程"，保证不丢数据
export function migrateLegacyScenes(): void {
  const scenes = getAllScenes()
  const legacy = scenes.filter((s) => !s.journeyId)
  if (legacy.length === 0) return

  const journeys = getAllJourneys()
  let unfiled = journeys.find((j) => j.routeName === UNFILED_JOURNEY_NAME)
  if (!unfiled) {
    const times = legacy
      .map((s) => new Date(s.timestamp).getTime())
      .sort((a, b) => a - b)
    unfiled = {
      id: crypto.randomUUID(),
      routeName: UNFILED_JOURNEY_NAME,
      seatDirection: '左',
      startTime: new Date(times[0]).toISOString(),
      endTime: new Date(times[times.length - 1]).toISOString(),
      createdAt: new Date().toISOString(),
    }
    journeys.push(unfiled)
    persistJourneys(journeys)
  }

  const unfiledId = unfiled.id
  persistScenes(scenes.map((s) => (s.journeyId ? s : { ...s, journeyId: unfiledId })))
}

export function saveJourney(journey: Journey): void {
  const journeys = getAllJourneys()
  journeys.push(journey)
  persistJourneys(journeys)
}

export function updateJourney(journey: Journey): void {
  persistJourneys(getAllJourneys().map((j) => (j.id === journey.id ? journey : j)))
}

// 删除行程时级联删除它下面的所有窗景
export function deleteJourney(id: string): void {
  persistJourneys(getAllJourneys().filter((j) => j.id !== id))
  persistScenes(getAllScenes().filter((s) => s.journeyId !== id))
}

export function saveScene(scene: WindowScene): void {
  const scenes = getAllScenes()
  scenes.push(scene)
  persistScenes(scenes)
}

export function deleteScene(id: string): void {
  persistScenes(getAllScenes().filter((s) => s.id !== id))
}

export function getScenesByJourney(journeyId: string): WindowScene[] {
  return getAllScenes()
    .filter((s) => s.journeyId === journeyId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

// 有效窗景：所属行程仍然存在的窗景（灵感抽取只从这里选）
export function getValidScenes(): WindowScene[] {
  const journeyIds = new Set(getAllJourneys().map((j) => j.id))
  return getAllScenes().filter((s) => journeyIds.has(s.journeyId))
}

export function getRandomScene(): WindowScene | null {
  const scenes = getValidScenes()
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}
