import { useEffect, useState } from 'react'
import { Search, Route as RouteIcon, X, Trash2, Clock, MapPin, ChevronDown, Armchair } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import { UNFILED_JOURNEY_ID } from '@/services/storage'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'
import type { WindowScene, Journey } from '@/types'

export default function TimelinePage() {
  const {
    journeys,
    scenes,
    routeNames,
    selectedRoute,
    selectRoute,
    loadAll,
    deleteJourney,
    deleteScene,
  } = useSceneStore()
  const [search, setSearch] = useState('')
  const [detailScene, setDetailScene] = useState<WindowScene | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const filteredRoutes = routeNames.filter((r) =>
    r.toLowerCase().includes(search.toLowerCase())
  )

  const matchesRoute = (j: Journey) =>
    !selectedRoute ||
    j.routeName === selectedRoute ||
    scenes.some((s) => s.journeyId === j.id && s.routeName === selectedRoute)

  const sortedJourneys = [...journeys]
    .filter(matchesRoute)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

  const scenesOf = (journeyId: string) =>
    scenes
      .filter((s) => s.journeyId === journeyId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // 进行中的行程默认展开，其余默认折叠
  const isExpanded = (j: Journey) => collapsed[j.id] ?? j.endTime === null
  const toggle = (j: Journey) =>
    setCollapsed((prev) => ({ ...prev, [j.id]: !(prev[j.id] ?? j.endTime === null) }))

  const handleDeleteJourney = (journey: Journey) => {
    const count = scenes.filter((s) => s.journeyId === journey.id).length
    if (window.confirm(`删除行程「${journey.name}」？其下 ${count} 条窗景将一并删除。`)) {
      deleteJourney(journey.id)
      if (detailScene?.journeyId === journey.id) setDetailScene(null)
    }
  }

  const handleDeleteScene = (id: string) => {
    deleteScene(id)
    setDetailScene(null)
  }

  return (
    <div className="min-h-screen bg-teal-950 font-serif text-mist-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-wide text-dusk-400">
          窗景时间线
        </h1>

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索路线..."
              className="w-full rounded-lg border border-teal-800 bg-teal-900/60 py-2.5 pl-10 pr-4 text-sm text-mist-100 placeholder:text-mist-500 focus:border-dusk-400 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => selectRoute('')}
              className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                !selectedRoute
                  ? 'bg-dusk-400 text-teal-950'
                  : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
              }`}
            >
              全部
            </button>
            {filteredRoutes.map((name) => (
              <button
                key={name}
                onClick={() => selectRoute(name)}
                className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${
                  selectedRoute === name
                    ? 'bg-dusk-400 text-teal-950'
                    : 'bg-teal-900 text-mist-300 hover:bg-teal-800'
                }`}
              >
                <RouteIcon className="mr-1 inline w-3 h-3" />
                {name}
              </button>
            ))}
          </div>
        </div>

        {sortedJourneys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-mist-400">
            <div className="mb-4 text-6xl opacity-30">🪟</div>
            <p className="text-lg">
              {selectedRoute
                ? '该路线暂无行程'
                : '还没有行程，去记录页开始一段行程吧'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedJourneys.map((journey) => {
              const journeyScenes = scenesOf(journey.id)
              const expanded = isExpanded(journey)
              return (
                <div
                  key={journey.id}
                  className="overflow-hidden rounded-xl border border-teal-800 bg-teal-900/50"
                >
                  <div className="flex items-center gap-1 p-4">
                    <button
                      onClick={() => toggle(journey)}
                      className="flex-1 space-y-1.5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          className={`w-4 h-4 text-dusk-400 transition-transform ${expanded ? '' : '-rotate-90'}`}
                        />
                        <span className="font-semibold text-mist-100">
                          {journey.name}
                        </span>
                        {journey.endTime === null && (
                          <span className="rounded bg-dusk-400/20 px-1.5 py-0.5 text-[10px] text-dusk-300">
                            进行中
                          </span>
                        )}
                        {journey.id === UNFILED_JOURNEY_ID && (
                          <span className="rounded bg-teal-800/60 px-1.5 py-0.5 text-[10px] text-mist-400">
                            历史记录
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-xs text-mist-400">
                        {journey.id !== UNFILED_JOURNEY_ID && (
                          <span className="flex items-center gap-1">
                            <Armchair className="w-3 h-3" />
                            {journey.seatDirection}侧
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(journey.startTime)}
                          {' — '}
                          {journey.endTime ? formatTimestamp(journey.endTime) : '至今'}
                        </span>
                        <span>{journeyScenes.length} 条窗景</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteJourney(journey)}
                      className="p-2 text-mist-500 transition-colors hover:text-red-300"
                      title="删除行程"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expanded && (
                    <div className="border-t border-teal-800 p-4">
                      {journeyScenes.length === 0 ? (
                        <p className="text-xs text-mist-500">该行程还没有窗景</p>
                      ) : (
                        <div className="relative pl-6">
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-teal-800" />
                          <div className="space-y-4">
                            {journeyScenes.map((scene) => (
                              <div key={scene.id} className="relative">
                                <div className="absolute -left-5 top-2 h-2 w-2 rounded-full bg-dusk-400 ring-4 ring-teal-900" />
                                <button
                                  onClick={() => setDetailScene(scene)}
                                  className="group w-full rounded-xl border border-teal-800 bg-teal-900/60 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-dusk-400/40 hover:shadow-lg hover:shadow-dusk-400/10"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {getWeatherIcon(scene.weather)}
                                      <span className="text-sm font-semibold text-mist-100">
                                        {scene.segment}
                                      </span>
                                    </div>
                                    <span className="shrink-0 text-[10px] text-mist-500">
                                      {formatTimestamp(scene.timestamp)} · {getTimeOfDay(scene.timestamp)}
                                    </span>
                                  </div>
                                  <div className="mb-1.5 flex items-center gap-1 text-mist-400">
                                    <MapPin className="w-3 h-3" />
                                    <span className="text-xs">{scene.routeName}</span>
                                    <span className="mx-1 text-teal-700">·</span>
                                    <span className="text-xs">{scene.seatDirection}侧</span>
                                  </div>
                                  {scene.note && (
                                    <p className="text-xs text-mist-400 line-clamp-2">
                                      {scene.note}
                                    </p>
                                  )}
                                  <div className="mt-2 flex items-center gap-2">
                                    {getTreeIcon(scene.treeDensity)}
                                    {getPedestrianIcon(scene.pedestrianStatus)}
                                    {scene.signText && (
                                      <span className="rounded bg-teal-800/60 px-1.5 py-0.5 text-[10px] text-mist-300">
                                        {scene.signText}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {detailScene && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setDetailScene(null)}
        >
          <div
            className="relative mx-4 w-full max-w-md animate-scale-in rounded-2xl border border-teal-700 bg-teal-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setDetailScene(null)}
              className="absolute right-4 top-4 text-mist-400 hover:text-mist-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              {getWeatherIcon(detailScene.weather)}
              <h2 className="text-xl font-bold text-dusk-400">{detailScene.segment}</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-mist-300">
                <MapPin className="w-4 h-4 text-dusk-400" />
                <span>{detailScene.routeName}</span>
                <span className="text-teal-600">·</span>
                <span>{detailScene.seatDirection}侧</span>
              </div>
              <div className="flex items-center gap-2 text-mist-300">
                <Clock className="w-4 h-4 text-dusk-400" />
                <span>{formatTimestamp(detailScene.timestamp)}</span>
                <span className="text-teal-600">·</span>
                <span>{getTimeOfDay(detailScene.timestamp)}</span>
              </div>
              <div className="flex items-center gap-3 text-mist-300">
                {getTreeIcon(detailScene.treeDensity)}
                <span>{detailScene.treeDensity}</span>
                {getPedestrianIcon(detailScene.pedestrianStatus)}
                <span>{detailScene.pedestrianStatus}</span>
              </div>
              {detailScene.signText && (
                <div className="rounded-lg bg-teal-800/50 px-3 py-2 text-mist-200">
                  招牌: {detailScene.signText}
                </div>
              )}
              {detailScene.note && (
                <div className="rounded-lg border border-teal-800 px-3 py-2 text-mist-300">
                  {detailScene.note}
                </div>
              )}
            </div>

            <button
              onClick={() => handleDeleteScene(detailScene.id)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-red-900/40 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-900/60"
            >
              <Trash2 className="w-4 h-4" />
              删除此窗景
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
