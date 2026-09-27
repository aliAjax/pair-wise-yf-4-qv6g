export type SeatDirection = '左' | '右'

export type Weather = '晴' | '多云' | '阴' | '小雨' | '大雨' | '雪' | '雾'

export type TreeDensity = '稀疏' | '适中' | '茂密'

export type PedestrianStatus = '稀少' | '零星' | '密集'

export interface Journey {
  id: string
  routeName: string
  seatDirection: SeatDirection
  startTime: string
  endTime: string | null
  createdAt: string
}

export interface WindowScene {
  id: string
  journeyId: string
  routeName: string
  segment: string
  seatDirection: SeatDirection
  timestamp: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}

export interface JourneyFormData {
  routeName: string
  seatDirection: SeatDirection
  startTime: string
}

export interface SceneFormData {
  segment: string
  weather: Weather
  signText: string
  treeDensity: TreeDensity
  pedestrianStatus: PedestrianStatus
  note: string
}
