import { useEffect, useMemo, useState } from 'react'
import { Search, X, Trash2, Clock, MapPin, Armchair, ChevronDown, ChevronRight } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import {
  formatTimestamp,
  getTimeOfDay,
  getWeatherIcon,
  getTreeIcon,
  getPedestrianIcon,
} from '@/utils/sceneHelpers'
import type { WindowScene } from '@/types'

export default function TimelinePage() {
  const { journeys, scenes, activeJourney, loadAll, deleteScene, deleteJourney } =
    useSceneStore()
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [detailScene, setDetailScene] = useState<WindowScene | null>(null)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // 默认展开进行中的行程，回到时间线时能直接看到正在记录的窗景
  useEffect(() => {
    if (activeJourney) {
      setExpandedIds((prev) =>
        prev.has(activeJourney.id) ? prev : new Set(prev).add(activeJourney.id)
      )
    }
  }, [activeJourney])

  const scenesByJourney = useMemo(() => {
    const map = new Map<string, WindowScene[]>()
    for (const scene of scenes) {
      const list = map.get(scene.journeyId) ?? []
      list.push(scene)
      map.set(scene.journeyId, list)
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    }
    return map
  }, [scenes])

  const filteredJourneys = journeys.filter((j) =>
    j.routeName.toLowerCase().includes(search.toLowerCase())
  )

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDeleteJourney = (id: string, routeName: string) => {
    if (window.confirm(`删除行程「${routeName}」将同时删除其下所有窗景，确定吗？`)) {
      deleteJourney(id)
      setDetailScene(null)
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

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-mist-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索行程线路..."
              className="w-full rounded-lg border border-teal-800 bg-teal-900/60 py-2.5 pl-10 pr-4 text-sm text-mist-100 placeholder:text-mist-500 focus:border-dusk-400 focus:outline-none"
            />
          </div>
        </div>

        {filteredJourneys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-mist-400">
            <div className="mb-4 text-6xl opacity-30">🪟</div>
            <p className="text-lg">
              {search ? '没有匹配的行程' : '还没有行程，去记录页开始一段吧'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJourneys.map((journey) => {
              const journeyScenes = scenesByJourney.get(journey.id) ?? []
              const expanded = expandedIds.has(journey.id)
              const ongoing = journey.endTime === null
              return (
                <div
                  key={journey.id}
                  className="overflow-hidden rounded-xl border border-teal-800 bg-teal-900/50"
                >
                  <div className="flex items-center gap-2 p-4">
                    <button
                      onClick={() => toggleExpand(journey.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 shrink-0 text-dusk-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 shrink-0 text-mist-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-mist-100">
                            {journey.routeName}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-mist-400">
                            <Armchair className="w-3 h-3" />
                            {journey.seatDirection}侧
                          </span>
                          {ongoing && (
                            <span className="rounded-full bg-dusk-400/20 px-2 py-0.5 text-[10px] text-dusk-300">
                              进行中
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-mist-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimestamp(journey.startTime)}</span>
                          <span className="text-teal-700">→</span>
                          <span>
                            {journey.endTime
                              ? formatTimestamp(journey.endTime)
                              : '未结束'}
                          </span>
                          <span className="text-teal-700">·</span>
                          <span>{journeyScenes.length} 段窗景</span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDeleteJourney(journey.id, journey.routeName)}
                      className="shrink-0 rounded-lg p-2 text-mist-500 transition-colors hover:bg-red-900/30 hover:text-red-300"
                      title="删除行程及其窗景"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expanded && (
                    <div className="border-t border-teal-800/70 px-4 py-4">
                      {journeyScenes.length === 0 ? (
                        <p className="py-4 text-center text-xs text-mist-500">
                          这段行程还没有窗景
                        </p>
                      ) : (
                        <div className="relative pl-6">
                          <div className="absolute left-2 top-0 bottom-0 w-px bg-teal-800" />
                          <div className="space-y-4">
                            {journeyScenes.map((scene) => (
                              <div key={scene.id} className="relative flex gap-3">
                                <div className="absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full bg-dusk-400 ring-4 ring-teal-900" />
                                <div className="w-16 shrink-0 pt-0.5 text-right">
                                  <p className="text-xs text-dusk-400">
                                    {formatTimestamp(scene.timestamp).split(' ')[1]}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-mist-500">
                                    {getTimeOfDay(scene.timestamp)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => setDetailScene(scene)}
                                  className="group flex-1 rounded-xl border border-teal-800 bg-teal-900/60 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-dusk-400/40 hover:shadow-lg hover:shadow-dusk-400/10"
                                >
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {getWeatherIcon(scene.weather)}
                                    <span className="text-sm font-semibold text-mist-100">
                                      {scene.segment}
                                    </span>
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
