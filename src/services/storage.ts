import type { WindowScene, Journey, JourneyFormData } from '@/types'

const SCENES_KEY = 'bus_window_scenes'
const JOURNEYS_KEY = 'bus_window_journeys'

export const UNFILED_JOURNEY_ID = 'journey-unfiled'
export const UNFILED_JOURNEY_NAME = '未归档行程'

function readScenes(): WindowScene[] {
  try {
    const raw = localStorage.getItem(SCENES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WindowScene[]
  } catch {
    return []
  }
}

function writeScenes(scenes: WindowScene[]): void {
  localStorage.setItem(SCENES_KEY, JSON.stringify(scenes))
}

function readJourneys(): Journey[] {
  try {
    const raw = localStorage.getItem(JOURNEYS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Journey[]
  } catch {
    return []
  }
}

function writeJourneys(journeys: Journey[]): void {
  localStorage.setItem(JOURNEYS_KEY, JSON.stringify(journeys))
}

/** 旧版窗景没有 journeyId，统一归入「未归档行程」，一条不丢 */
function migrateLegacyScenes(): void {
  const scenes = readScenes()
  const legacy = scenes.filter((s) => !s.journeyId)
  if (legacy.length === 0) return

  const journeys = readJourneys()
  if (!journeys.some((j) => j.id === UNFILED_JOURNEY_ID)) {
    const times = legacy.map((s) => new Date(s.timestamp).getTime())
    journeys.push({
      id: UNFILED_JOURNEY_ID,
      name: UNFILED_JOURNEY_NAME,
      routeName: '未归档',
      seatDirection: '左',
      startTime: new Date(Math.min(...times)).toISOString(),
      // 未归档行程必须是已结束的，避免被当作进行中的行程
      endTime: new Date(Math.max(...times)).toISOString(),
      createdAt: new Date().toISOString(),
    })
    writeJourneys(journeys)
  }

  writeScenes(
    scenes.map((s) => (s.journeyId ? s : { ...s, journeyId: UNFILED_JOURNEY_ID }))
  )
}

export function getAllJourneys(): Journey[] {
  migrateLegacyScenes()
  return readJourneys()
}

export function getAllScenes(): WindowScene[] {
  migrateLegacyScenes()
  return readScenes()
}

/** 有效窗景：所属行程仍然存在的窗景 */
export function getValidScenes(): WindowScene[] {
  const journeyIds = new Set(getAllJourneys().map((j) => j.id))
  return getAllScenes().filter((s) => journeyIds.has(s.journeyId))
}

export function getActiveJourney(): Journey | null {
  return getAllJourneys().find((j) => j.endTime === null) ?? null
}

export function createJourney(data: JourneyFormData): Journey {
  const now = new Date().toISOString()
  // 同时只允许一条进行中的行程，开新行程前先把旧的收尾
  const journeys = getAllJourneys().map((j) =>
    j.endTime === null ? { ...j, endTime: now } : j
  )
  const journey: Journey = {
    id: crypto.randomUUID(),
    name: data.routeName,
    routeName: data.routeName,
    seatDirection: data.seatDirection,
    startTime: now,
    endTime: null,
    createdAt: now,
  }
  journeys.push(journey)
  writeJourneys(journeys)
  return journey
}

export function endJourney(id: string): void {
  const now = new Date().toISOString()
  writeJourneys(
    getAllJourneys().map((j) =>
      j.id === id && j.endTime === null ? { ...j, endTime: now } : j
    )
  )
}

/** 删除行程时，其下的窗景一并删除 */
export function deleteJourney(id: string): void {
  writeJourneys(getAllJourneys().filter((j) => j.id !== id))
  writeScenes(readScenes().filter((s) => s.journeyId !== id))
}

export function saveScene(scene: WindowScene): void {
  const scenes = getAllScenes()
  scenes.push(scene)
  writeScenes(scenes)
}

export function deleteScene(id: string): void {
  writeScenes(getAllScenes().filter((s) => s.id !== id))
}

export function getScenesByJourney(journeyId: string): WindowScene[] {
  return getAllScenes()
    .filter((s) => s.journeyId === journeyId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function getAllRouteNames(): string[] {
  const names = new Set<string>()
  getAllJourneys().forEach((j) => names.add(j.routeName))
  getValidScenes().forEach((s) => names.add(s.routeName))
  return Array.from(names).sort()
}

/** 灵感抽取只从有效窗景里选 */
export function getRandomScene(): WindowScene | null {
  const scenes = getValidScenes()
  if (scenes.length === 0) return null
  return scenes[Math.floor(Math.random() * scenes.length)]
}
