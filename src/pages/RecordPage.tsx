import { useState, useEffect } from 'react'
import { Bus, MapPin, Armchair, Clock, CloudSun, Signpost, TreePine, Users, FileText, Send, Play, Square } from 'lucide-react'
import { useSceneStore } from '@/store/useSceneStore'
import { getWeatherIcon, getTreeIcon, getPedestrianIcon, formatTimestamp } from '@/utils/sceneHelpers'
import type { SceneFormData, Weather, TreeDensity, PedestrianStatus, SeatDirection } from '@/types'

const WEATHERS: Weather[] = ['晴', '多云', '阴', '小雨', '大雨', '雪', '雾']
const TREES: TreeDensity[] = ['稀疏', '适中', '茂密']
const PEDESTRIANS: PedestrianStatus[] = ['稀少', '零星', '密集']

const initialSceneForm: SceneFormData = {
  segment: '',
  weather: '晴',
  signText: '',
  treeDensity: '适中',
  pedestrianStatus: '稀少',
  note: '',
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function RecordPage() {
  const { activeJourney, scenes, loadAll, startJourney, endJourney, saveScene } = useSceneStore()
  const [routeName, setRouteName] = useState('')
  const [seatDirection, setSeatDirection] = useState<SeatDirection>('左')
  const [startTime, setStartTime] = useState(() => toLocalInputValue(new Date()))
  const [form, setForm] = useState<SceneFormData>(initialSceneForm)
  const [now, setNow] = useState(new Date())
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const update = <K extends keyof SceneFormData>(key: K, val: SceneFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleStartJourney = (e: React.FormEvent) => {
    e.preventDefault()
    startJourney({
      routeName: routeName.trim(),
      seatDirection,
      startTime: new Date(startTime).toISOString(),
    })
    setRouteName('')
    setSeatDirection('左')
  }

  const handleSaveScene = (e: React.FormEvent) => {
    e.preventDefault()
    saveScene(form)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setForm(initialSceneForm)
    }, 1500)
  }

  const journeySceneCount = activeJourney
    ? scenes.filter((s) => s.journeyId === activeJourney.id).length
    : 0

  return (
    <div className="relative min-h-screen bg-teal-950 p-4 pb-24">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-bounce flex flex-col items-center gap-2 opacity-0" style={{ animation: 'fadeInUp 1.5s ease forwards' }}>
            <Bus className="w-16 h-16 text-dusk-400" />
            <span className="text-mist-100 font-serif text-lg">记录已保存</span>
          </div>
          <style>{`@keyframes fadeInUp { 0% { opacity:0; transform:translateY(20px) } 40% { opacity:1; transform:translateY(0) } 100% { opacity:0; transform:translateY(-40px) } }`}</style>
        </div>
      )}

      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Bus className="w-6 h-6 text-dusk-400" />
          <h1 className="text-mist-100 font-serif text-2xl">窗景记录</h1>
        </div>

        {!activeJourney ? (
          <form onSubmit={handleStartJourney} className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
                <Play className="w-4 h-4" />开始一段行程
              </h2>
              <p className="text-mist-400 text-xs leading-relaxed">
                先建好行程，之后保存窗景只需补区间和观察内容；未结束的行程切换页面后仍会保留。
              </p>
              <div>
                <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Bus className="w-3 h-3" />线路</label>
                <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={routeName} onChange={(e) => setRouteName(e.target.value)} required />
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Armchair className="w-3 h-3" />座位方向</label>
                <div className="flex gap-2">
                  {(['左', '右'] as SeatDirection[]).map((d) => (
                    <button key={d} type="button" onClick={() => setSeatDirection(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${seatDirection === d ? 'bg-dusk-400/20 text-dusk-400 border border-dusk-400' : 'bg-teal-850 text-mist-300 border border-transparent'}`}>
                      {d}侧
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Clock className="w-3 h-3" />开始时间</label>
                <input type="datetime-local" className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
            </section>

            <button type="submit"
              className="w-full py-3 rounded-xl bg-dusk-400 text-teal-950 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition">
              <Play className="w-4 h-4" />开始行程
            </button>
          </form>
        ) : (
          <form onSubmit={handleSaveScene} className="space-y-6">
            <section className="rounded-2xl border border-dusk-400/30 bg-dusk-400/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4" />进行中的行程
                </h2>
                <span className="rounded-full bg-dusk-400/20 px-2.5 py-0.5 text-[10px] text-dusk-300">进行中</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mist-200">
                <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5 text-dusk-400" />{activeJourney.routeName}</span>
                <span className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5 text-dusk-400" />{activeJourney.seatDirection}侧</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-dusk-400" />{formatTimestamp(activeJourney.startTime)} 出发</span>
              </div>
              <p className="text-mist-400 text-xs">已记录 {journeySceneCount} 段窗景</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4" />区间
              </h2>
              <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={form.segment} onChange={(e) => update('segment', e.target.value)} placeholder="如：体育馆 → 火车站" required />
            </section>

            <section className="space-y-3">
              <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
                <CloudSun className="w-4 h-4" />窗景信息
              </h2>
              <div>
                <label className="text-mist-300 text-xs mb-1 block">天气</label>
                <div className="grid grid-cols-4 gap-2">
                  {WEATHERS.map((w) => (
                    <button key={w} type="button" onClick={() => update('weather', w)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition ${form.weather === w ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400' : 'bg-teal-850 border border-transparent text-mist-300'}`}>
                      {getWeatherIcon(w)}{w}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Signpost className="w-3 h-3" />招牌文字</label>
                <input className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400" value={form.signText} onChange={(e) => update('signText', e.target.value)} />
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><TreePine className="w-3 h-3" />树木密度</label>
                <div className="grid grid-cols-3 gap-2">
                  {TREES.map((t) => (
                    <button key={t} type="button" onClick={() => update('treeDensity', t)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${form.treeDensity === t ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400' : 'bg-teal-850 border border-transparent text-mist-300'}`}>
                      {getTreeIcon(t)}{t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-mist-300 text-xs mb-1 flex items-center gap-1"><Users className="w-3 h-3" />行人状态</label>
                <div className="grid grid-cols-3 gap-2">
                  {PEDESTRIANS.map((p) => (
                    <button key={p} type="button" onClick={() => update('pedestrianStatus', p)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs transition ${form.pedestrianStatus === p ? 'bg-dusk-400/20 border border-dusk-400 text-dusk-400' : 'bg-teal-850 border border-transparent text-mist-300'}`}>
                      {getPedestrianIcon(p)}{p}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-dusk-400 font-serif text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />观察笔记
              </h2>
              <textarea className="w-full bg-teal-850 text-mist-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-dusk-400 resize-none h-24" value={form.note} onChange={(e) => update('note', e.target.value)} />
            </section>

            <div className="flex items-center gap-2 text-mist-400 text-xs">
              <Clock className="w-3 h-3" />
              <span>{formatTimestamp(now.toISOString())}</span>
            </div>

            <div className="space-y-2">
              <button type="submit"
                className="w-full py-3 rounded-xl bg-dusk-400 text-teal-950 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition">
                <Send className="w-4 h-4" />保存窗景
              </button>
              <button type="button" onClick={endJourney}
                className="w-full py-3 rounded-xl border border-dusk-400/40 text-dusk-300 font-medium text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-dusk-400/10">
                <Square className="w-4 h-4" />结束行程
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
