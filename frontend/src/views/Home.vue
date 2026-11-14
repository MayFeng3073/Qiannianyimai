<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStats } from '@/services/familyStore'
import { relatedDynastyRefs } from '@/services/dynastyRelations'
import { readRecentDynasties } from '@/services/recentDynasties'

interface SearchEntry {
  t: 'd' | 'p' | 'e' | 'k'
  i?: number
  n: string
  s: string
  l?: number
  a?: string[]
  d?: number
  o?: string
  w?: number
}
interface DynastyLite {
  id: number
  name: string
  start: number
  end: number
  capital: string
  duration: string
  summary: string
}
interface SearchIndex {
  stats: { persons: number; events: number; works: number; relations: number; keywords: number; dynasties: number }
  dynasties: DynastyLite[]
  entries: SearchEntry[]
}

const router = useRouter()
const searchQuery = ref('')
const isLoaded = ref(false)
const isScrolled = ref(false)
const visibleSections = ref<Record<string, boolean>>({})
const animatedNumbers = ref<Record<string, number>>({})

const popularSearches = ['李白', '武则天', '安史之乱', '唐朝', '丝绸之路', '辛亥革命']

/* ---------------- 全库索引（首次交互时加载一次） ---------------- */
const indexData = ref<SearchIndex | null>(null)
const indexLoading = ref(false)
const indexError = ref('')
let indexPromise: Promise<void> | null = null

const ensureIndex = (): Promise<void> => {
  if (indexData.value) return Promise.resolve()
  if (indexPromise) return indexPromise
  indexLoading.value = true
  indexPromise = fetch('/data/search-index.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status)
      return r.json()
    })
    .then((data: SearchIndex) => {
      indexData.value = data
    })
    .catch(() => {
      indexError.value = '索引加载失败，请检查网络后刷新'
      indexPromise = null
    })
    .finally(() => {
      indexLoading.value = false
    })
  return indexPromise
}

/* ---------------- 搜索交互 ---------------- */
const searchOpen = ref(false)
const activeIndex = ref(0)
const searchBoxRef = ref<HTMLElement | null>(null)

const TYPE_LABEL: Record<SearchEntry['t'], string> = { d: '朝代', p: '人物', e: '事件', k: '词条' }
const TYPE_LIMIT: Record<SearchEntry['t'], number> = { d: 3, p: 5, e: 4, k: 3 }
const TYPE_ORDER: SearchEntry['t'][] = ['d', 'p', 'e', 'k']

const rankOf = (e: SearchEntry, q: string) => {
  if (e.n === q) return 0
  if (e.n.startsWith(q)) return 1
  if (e.n.includes(q)) return 2
  if ((e.a || []).some(x => x === q || x.startsWith(q))) return 1
  if (e.s.includes(q)) return 3
  return -1
}

const scoredMatches = computed(() => {
  const data = indexData.value
  const q = searchQuery.value.trim()
  if (!data || !q) return []
  const scored = data.entries
    .map(e => ({ e, r: rankOf(e, q) }))
    .filter(x => x.r >= 0)
    .sort((x, y) => x.r - y.r || x.e.n.length - y.e.n.length)
  // 词条与人物同名时只保留人物：词条本身没有独立页面，跳过去只会落在朝代首页
  const personNames = new Set(scored.filter(x => x.e.t === 'p').map(x => x.e.n))
  return scored.filter(x => x.e.t !== 'k' || !personNames.has(x.e.n))
})

const hitCount = computed(() => scoredMatches.value.length)

const flatResults = computed<SearchEntry[]>(() => {
  const out: SearchEntry[] = []
  for (const t of TYPE_ORDER) {
    scoredMatches.value.filter(x => x.e.t === t).slice(0, TYPE_LIMIT[t]).forEach(x => out.push(x.e))
  }
  return out
})

const resultGroups = computed(() => {
  const groups: Array<{ t: SearchEntry['t']; label: string; items: SearchEntry[] }> = []
  for (const e of flatResults.value) {
    let g = groups.find(x => x.t === e.t)
    if (!g) {
      g = { t: e.t, label: TYPE_LABEL[e.t], items: [] }
      groups.push(g)
    }
    g.items.push(e)
  }
  return groups
})

const openEntry = (e: SearchEntry) => {
  searchOpen.value = false
  if (e.t === 'd' && e.i) router.push(`/dynasty/${e.i}`)
  else if (e.t === 'p' && e.i) router.push(e.l === 2 ? `/person/${e.i}/story` : `/person/${e.i}`)
  else if (e.t === 'e' && e.i) router.push(`/event/${e.i}`)
  else if (e.t === 'k' && e.d) router.push(`/dynasty/${e.d}?kw=${encodeURIComponent(e.n)}`)
}

const runSearch = () => {
  ensureIndex()
  const list = flatResults.value
  if (!list.length) {
    if (searchQuery.value.trim()) searchOpen.value = true
    return
  }
  openEntry(list[Math.min(activeIndex.value, list.length - 1)])
}

const openSearch = () => {
  ensureIndex()
  // 空输入时不弹下拉，由输入框 placeholder 承担提示
  searchOpen.value = !!searchQuery.value.trim()
  activeIndex.value = 0
}

const onQueryInput = () => {
  ensureIndex()
  searchOpen.value = !!searchQuery.value.trim()
  activeIndex.value = 0
}

const onSearchKey = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!searchOpen.value) { openSearch(); return }
    if (flatResults.value.length) activeIndex.value = (activeIndex.value + 1) % flatResults.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (flatResults.value.length) {
      activeIndex.value = (activeIndex.value - 1 + flatResults.value.length) % flatResults.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    runSearch()
  } else if (e.key === 'Escape') {
    searchOpen.value = false
  }
}

const pickHot = async (term: string) => {
  searchQuery.value = term
  await ensureIndex()
  const first = flatResults.value[0]
  if (first) {
    // 热门搜索一点直达对应详情页
    openEntry(first)
    return
  }
  searchOpen.value = true
}

const clearSearch = () => {
  searchQuery.value = ''
  activeIndex.value = 0
  searchOpen.value = false
}

const onDocMouseDown = (ev: MouseEvent) => {
  if (!searchOpen.value) return
  const box = searchBoxRef.value
  if (box && !box.contains(ev.target as Node)) searchOpen.value = false
}

/* ---------------- 配图（与人物/事件数据同一套生成规则） ---------------- */
const imageFor = (name: string, kind: 'person' | 'event' | 'dynasty') => {
  const size = kind === 'person' ? 'portrait_3_4' : 'landscape_16_9'
  const phrase = kind === 'person'
    ? `ancient chinese historical figure ${name} traditional ink painting style portrait`
    : kind === 'dynasty'
      ? `ancient chinese ${name} dynasty landscape traditional ink painting style`
      : `ancient chinese historical event ${name} traditional ink painting style`
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(phrase)}&image_size=${size}`
}

/* ---------------- 继续探索：日期种子 + 内容关联的确定性推荐 ---------------- */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 本地日期序号：同一天固定、跨天变化 */
const dayIndex = () => {
  const now = new Date()
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000)
}

const shuffled = <T,>(list: T[], seed: number): T[] => {
  const rnd = mulberry32(seed)
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// 冷门朝代曝光补偿：让夏商西周、春秋战国、晋南北朝、隋、元、民国也轮得到
const COLD_BOOST: Record<number, number> = { 201: 2, 202: 2, 203: 2, 110: 2, 111: 2, 114: 2, 117: 2 }

/** 一周内不重复的朝代序列（冷门朝代权重更高、更靠前） */
const weeklyDynastyOrder = (week: number): number[] => {
  const ids = (indexData.value?.dynasties || []).map(d => d.id)
  if (!ids.length) return []
  const pool: number[] = []
  for (const id of ids) {
    for (let i = 0; i < (COLD_BOOST[id] || 1); i++) pool.push(id)
  }
  return Array.from(new Set(shuffled(pool, week * 1013 + 17)))
}

const dynastyNameOf = (id: number) =>
  (indexData.value?.dynasties || []).find(d => d.id === id)?.name || ''

/** 当天「今日历史」所属朝代：按周轮换，跨周时避开前一天 */
const dailyDynastyId = (day: number): number => {
  const week = Math.floor(day / 7)
  const dow = day - week * 7
  const order = weeklyDynastyOrder(week)
  if (!order.length) return 0
  let id = order[dow % order.length]
  if (dow === 0) {
    const prevOrder = weeklyDynastyOrder(week - 1)
    if (prevOrder.length && prevOrder[6] === id) id = order[(dow + 1) % order.length]
  }
  return id
}

const eventsByDynasty = computed(() => {
  const map = new Map<number, SearchEntry[]>()
  if (!indexData.value) return map
  for (const e of indexData.value.entries) {
    if (e.t !== 'e' || !e.i) continue
    const did = e.d || Math.floor(e.i / 1000)
    const list = map.get(did)
    if (list) list.push(e)
    else map.set(did, [e])
  }
  return map
})

const personsByDynasty = computed(() => {
  const map = new Map<number, SearchEntry[]>()
  if (!indexData.value) return map
  for (const p of indexData.value.entries) {
    if (p.t !== 'p' || !p.i) continue
    const did = p.d || Math.floor(p.i / 1000)
    const list = map.get(did)
    if (list) list.push(p)
    else map.set(did, [p])
  }
  return map
})

const dailyEvent = computed<SearchEntry | null>(() => {
  if (!indexData.value) return null
  const day = dayIndex()
  let did = dailyDynastyId(day)
  let list = eventsByDynasty.value.get(did) || []
  // 优先选用带影响句、叙事完整的事件
  const rich = list.filter(e => (e.o || '').length >= 12)
  if (rich.length) list = rich
  if (list.length) {
    const maxW = Math.max(...list.map(e => e.w || 1))
    const core = list.filter(e => (e.w || 1) >= maxW * 0.6)
    if (core.length) list = core
  }

  if (!list.length) {
    for (const alt of weeklyDynastyOrder(Math.floor(day / 7))) {
      const l = eventsByDynasty.value.get(alt) || []
      if (l.length) { did = alt; list = l; break }
    }
  }
  if (!list.length) return null
  // 按知名度加权抽取：叙事/人物/影响越完整的事件越容易被选中
  const rnd = mulberry32(day * 7919 + did)
  const total = list.reduce((sum, e) => sum + Math.max(1, e.w || 1), 0)
  let r = rnd() * total
  for (const e of list) {
    r -= Math.max(1, e.w || 1)
    if (r <= 0) return e
  }
  return list[list.length - 1]
})

/** 热门人物：每天 4 个不同朝代、每朝 1 位，优先有独立故事页的人物 */
const hotPersons = computed<SearchEntry[]>(() => {
  if (!indexData.value) return []
  const day = dayIndex()
  const week = Math.floor(day / 7)
  const dow = day - week * 7
  const ids = indexData.value.dynasties.map(d => d.id)
  const order = shuffled(ids, week * 7919 + 101)
  if (!order.length) return []

  const prevDay = day - 1
  const prevWeek = Math.floor(prevDay / 7)
  const prevDow = prevDay - prevWeek * 7
  const prevOrder = shuffled(ids, prevWeek * 7919 + 101)

  const out: SearchEntry[] = []
  for (let k = 0; k < 4 && k < order.length; k++) {
    const did = order[(dow * 4 + k) % order.length]
    const all = personsByDynasty.value.get(did) || []
    if (!all.length) continue
    // 先按影响力取前 6 位候选，再按日期种子轮换，避免每天都是同一人
    const pool = all
      .slice()
      .sort((a, b) => (b.w || 0) - (a.w || 0) || (a.i || 0) - (b.i || 0))
      .slice(0, 6)
    const size = pool.length
    let person = pool[Math.floor(mulberry32(day * 104729 + did)() * size)]

    // 同一朝代、同一位置昨天已推送过同一人时顺延一位
    const prevDid = prevOrder[(prevDow * 4 + k) % prevOrder.length]
    if (prevDid === did && pool.length > 1) {
      const prevPerson = pool[Math.floor(mulberry32((day - 1) * 104729 + did)() * size)]
      if (prevPerson && prevPerson.i === person.i) {
        person = pool[(pool.indexOf(person) + 1) % pool.length]
      }
    }
    if (person) out.push(person)
  }
  return out
})

/** 为你推荐：优先接着最近浏览的朝代，推荐内容相关的朝代 */
const recommendation = computed<{ dynasty: DynastyLite; reason: string } | null>(() => {
  const list = indexData.value?.dynasties || []
  if (!list.length) return null
  const byId = (id: number) => list.find(d => d.id === id)

  // 另外两张卡已占用的朝代，避免三卡撞车
  const used = new Set<number>()
  const ev = dailyEvent.value
  if (ev?.d) used.add(ev.d)
  for (const p of hotPersons.value) {
    if (p.d) used.add(p.d)
  }

  const recent = readRecentDynasties().find(id => !!byId(id))
  if (recent) {
    for (const ref of relatedDynastyRefs(recent)) {
      if (used.has(ref.id)) continue
      const d = byId(ref.id)
      if (d) return { dynasty: d, reason: `你刚看过${dynastyNameOf(recent)} · ${ref.reason}` }
    }
    // 关联朝代都被占用时，退到时间上最近的未占用朝代
    const ordered = [...list].sort((a, b) => a.start - b.start)
    const i = ordered.findIndex(d => d.id === recent)
    for (const step of [1, -1, 2, -2]) {
      const d = ordered[i + step]
      if (d && !used.has(d.id)) return { dynasty: d, reason: `你刚看过${dynastyNameOf(recent)} · 时间相邻` }
    }
  }

  const day = dayIndex()
  const order = weeklyDynastyOrder(Math.floor(day / 7))
  const fallbackId = order.find(id => !used.has(id)) || order[0]
  const d = fallbackId ? byId(fallbackId) : undefined
  return d ? { dynasty: d, reason: '本周精选 · 与今日内容互补' } : null
})

const dailyDynasty = computed<DynastyLite | null>(() => recommendation.value?.dynasty || null)
const recommendReason = computed(() => recommendation.value?.reason || '')

const dailyDynastyDesc = computed(() => {
  const s = dailyDynasty.value?.summary || ''
  const first = s.split(/[。；]/)[0]
  return first ? first + '。' : ''
})

/* ---------------- 统计数字 ---------------- */
const stats = ref({ persons: 0, events: 0, works: 0, family: 0 })
const statisticsVisible = ref(false)
let countersStarted = false

const fmtNum = (n?: number) => (n || 0).toLocaleString('en-US')

const animateNumbers = () => {
  if (countersStarted || !statisticsVisible.value) return
  if (!stats.value.persons) return
  countersStarted = true
  const items = [
    { id: 'person_count', target: stats.value.persons, duration: 2200 },
    { id: 'event_count', target: stats.value.events, duration: 2000 },
    { id: 'work_count', target: stats.value.works, duration: 2400 },
    { id: 'family_count', target: stats.value.family, duration: 1600 }
  ]
  for (const { id, target, duration } of items) {
    const from = animatedNumbers.value[id] || 0
    const startTime = performance.now()
    const update = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      animatedNumbers.value[id] = Math.floor(from + (target - from) * eased)
      if (progress < 1) requestAnimationFrame(update)
      else animatedNumbers.value[id] = target
    }
    requestAnimationFrame(update)
  }
}

const loadStats = async () => {
  await ensureIndex()
  const s = indexData.value?.stats
  if (s) {
    stats.value.persons = s.persons
    stats.value.events = s.events
    stats.value.works = s.works
  }
  animateNumbers()
}

const loadFamilyCount = async () => {
  try {
    const f = await getStats()
    stats.value.family = f.members + f.lifeEvents + f.stories + f.photos + f.historyLinks
  } catch {
    stats.value.family = 0
  }
  if (countersStarted) animatedNumbers.value.family_count = stats.value.family
  else animateNumbers()
}

/* ---------------- 滚动动画 ---------------- */
let sectionObserver: IntersectionObserver | null = null

const animateElements = () => {
  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('data-animate')
        if (id && entry.isIntersecting) {
          visibleSections.value[id] = true
          sectionObserver?.unobserve(entry.target)

          if (id === 'statistics') {
            statisticsVisible.value = true
            animateNumbers()
          }
        }
      })
    },
    { threshold: 0.2, rootMargin: '-30px' }
  )

  document.querySelectorAll('[data-animate]').forEach((el) => {
    sectionObserver!.observe(el)
  })
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 50)

  animateElements()
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('mousedown', onDocMouseDown)

  // 索引立即预加载，让继续探索卡片内容尽早与淡入动效同步
  ensureIndex()
  loadStats()
  loadFamilyCount()
})

onUnmounted(() => {
  sectionObserver?.disconnect()
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('mousedown', onDocMouseDown)
})

const navigateToPerson = (id?: number, level?: number) => {
  if (!id) return
  router.push(level === 2 ? `/person/${id}/story` : `/person/${id}`)
}

const navigateToTimeline = () => {
  router.push('/timeline')
}

const navigateToFamily = () => {
  router.push('/family')
}

const openDailyEvent = () => {
  if (dailyEvent.value?.i) router.push(`/event/${dailyEvent.value.i}`)
}

const openDailyDynasty = () => {
  if (dailyDynasty.value) router.push(`/dynasty/${dailyDynasty.value.id}`)
}
</script>

<template>
  <div class="min-h-screen bg-rice-white relative overflow-x-hidden">
    <div class="absolute inset-0 paper-texture pointer-events-none"></div>

    <header 
      class="fixed top-0 left-0 right-0 z-50 py-4 px-8 transition-all duration-500" 
      :class="[
        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
        isScrolled ? 'glass-nav' : ''
      ]"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div 
          @click="router.push('/')"
          class="flex items-center gap-3 cursor-pointer"
        >
          <div class="w-10 h-10 rounded-md bg-gradient-to-br from-[#355C5A] to-[#C34739] flex items-center justify-center shadow-md border border-white/30">
            <svg viewBox="0 0 40 40" class="w-8 h-8">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#F8F6F2" stroke-width="1"/>
              <circle cx="20" cy="20" r="15" fill="none" stroke="#F8F6F2" stroke-width="0.5"/>
              <path d="M20 6 L20 34" stroke="#F8F6F2" stroke-width="0.5"/>
              <path d="M6 20 L34 20" stroke="#F8F6F2" stroke-width="0.5"/>
              <circle cx="20" cy="20" r="8" fill="none" stroke="#F8F6F2" stroke-width="0.5"/>
              <text x="20" y="25" text-anchor="middle" fill="#F8F6F2" font-size="16" font-family="'Ma Shan Zheng', cursive">千</text>
            </svg>
          </div>
          <span class="font-calligraphy text-xl text-[#2C2C2C] tracking-widest">千年一脉</span>
        </div>
        <nav class="flex items-center gap-10">
          <span 
            @click="navigateToTimeline"
            class="text-sm text-[#355C5A] cursor-pointer hover:text-[#C34739] transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            中国历史
          </span>
          <span 
            @click="navigateToFamily"
            class="text-sm text-[#355C5A] cursor-pointer hover:text-[#C34739] transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            我的家族
          </span>
        </nav>
      </div>
    </header>

    <section class="relative min-h-screen flex items-center justify-center px-8 overflow-hidden pt-20">
      <div class="absolute inset-0">
        <img 
          src="/hero-bg.png"
          alt="Hero Background"
          class="w-full h-full object-cover opacity-95"
        />
        <div class="absolute inset-0 bg-gradient-to-b from-[#F8F6F2]/10 via-transparent to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#F5F2EC] via-[#F5F2EC]/80 to-transparent"></div>
        <div class="absolute bottom-0 left-1/4 w-32 h-32 bg-[#2C2C2C]/5 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-1/2 w-24 h-24 bg-[#355C5A]/5 rounded-full blur-2xl"></div>
        <div class="absolute bottom-0 right-1/4 w-20 h-20 bg-[#4A4A3A]/5 rounded-full blur-xl"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto text-center w-full">
        <div 
          class="font-calligraphy text-7xl md:text-9xl mb-6 tracking-wider"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
          style="background: linear-gradient(135deg, #2C2C2C 0%, #355C5A 30%, #4A4A3A 60%, #C34739 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
        >
          千年一脉
        </div>
        
        <div 
          class="text-xl md:text-2xl text-[#355C5A] mb-2 font-light font-serif"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
        >
          在历史中看见家族
        </div>
        
        <div 
          class="text-xl md:text-2xl text-[#355C5A] mb-8 font-light font-serif"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-2' : 'opacity-0'"
        >
          在家族中看见历史
        </div>

        <div 
          class="text-lg text-[#4A4A3A] italic font-serif mb-10 max-w-xl mx-auto"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-3' : 'opacity-0'"
        >
          每一个普通人的故事，都是历史的一部分。
        </div>

        <div 
          class="max-w-[800px] mx-auto mb-16"
          :class="isLoaded ? 'animate-fade-up fade-up-delay-4' : 'opacity-0'"
        >
          <div ref="searchBoxRef" class="relative">
            <div class="bg-white/85 backdrop-blur-sm rounded-lg px-6 py-4 flex items-center gap-4 shadow-lg border border-white/60">
              <svg class="w-5 h-5 text-[#4A4A3A] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input 
                v-model="searchQuery"
                @focus="openSearch"
                @input="onQueryInput"
                @keydown="onSearchKey"
                type="text" 
                placeholder="搜索人物 / 事件 / 朝代 / 词条..."
                class="flex-1 bg-transparent outline-none text-[#2C2C2C] placeholder:text-[#4A4A3A]/50"
              />
              <button 
                v-if="searchQuery"
                @click="clearSearch"
                class="text-[#4A4A3A]/40 hover:text-[#4A4A3A] text-lg leading-none shrink-0"
                aria-label="清空"
              >×</button>
            </div>

            <div 
              v-if="searchOpen"
              class="absolute left-0 right-0 top-full mt-2 z-50 max-h-[440px] overflow-y-auto rounded-lg bg-white shadow-2xl border border-[#355C5A]/10 text-left"
            >
              <div v-if="indexLoading && !indexData" class="px-5 py-6 text-sm text-[#4A4A3A]/60">
                正在加载全库索引…
              </div>
              <div v-else-if="indexError" class="px-5 py-6 text-sm text-[#C34739]">
                {{ indexError }}
              </div>
              <div v-else-if="!flatResults.length" class="px-5 py-6 text-sm text-[#4A4A3A]/60">
                未找到「{{ searchQuery }}」相关内容，试试朝代（唐）、人物（李白）或事件（安史之乱）
              </div>
              <template v-else>
                <div v-for="group in resultGroups" :key="group.t">
                  <div class="px-5 pt-3 pb-1 text-xs tracking-widest text-[#4A4A3A]/45">{{ group.label }}</div>
                  <div 
                    v-for="item in group.items" 
                    :key="group.t + '-' + item.n + '-' + (item.i || item.d || '')"
                    @click="openEntry(item)"
                    @mouseenter="activeIndex = flatResults.indexOf(item)"
                    class="px-5 py-2.5 cursor-pointer flex items-center gap-3 transition-colors"
                    :class="activeIndex === flatResults.indexOf(item) ? 'bg-[#355C5A]/10' : 'hover:bg-[#355C5A]/5'"
                  >
                    <span class="text-sm text-[#2C2C2C] font-medium whitespace-nowrap">{{ item.n }}</span>
                    <span class="text-xs text-[#4A4A3A]/55 truncate">{{ item.s }}</span>
                    <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-[#D8B26A]/40 text-[#8B5A2B] shrink-0">{{ TYPE_LABEL[item.t] }}</span>
                  </div>
                </div>
                <div class="px-5 py-2.5 border-t border-[#355C5A]/10 flex items-center justify-between text-[11px] text-[#4A4A3A]/45">
                  <span>共 {{ hitCount }} 条，展示前 {{ flatResults.length }} 条</span>
                  <span>↑↓ 选择 · 回车打开 · Esc 关闭</span>
                </div>
              </template>
            </div>
          </div>
          
          <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span class="text-xs text-[#4A4A3A]/70">热门搜索：</span>
            <button 
              v-for="term in popularSearches" 
              :key="term"
              @click="pickHot(term)"
              class="px-3 py-1 text-xs bg-white/60 hover:bg-[#355C5A]/10 hover:text-[#355C5A] rounded-md transition-colors border border-[#355C5A]/10"
            >{{ term }}</button>
          </div>
        </div>

      </div>
    </section>

    <section class="py-16 px-8 bg-[#F5F2EC]/30">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" data-animate="explore-section">
          <div 
            @click="navigateToTimeline"
            class="relative cursor-pointer rounded-lg overflow-hidden h-[280px]"
            :class="visibleSections['explore-section'] ? 'animate-fade-up' : 'opacity-0'"
          >
            <div class="absolute inset-0">
              <img 
                src="/history-card-bg.png"
                alt="中国历史"
                class="w-full h-full object-cover brightness-75 contrast-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#355C5A]/40 via-[#355C5A]/10 to-transparent"></div>
            </div>
            <div class="relative z-10 p-8">
              <h3 class="font-calligraphy text-3xl text-[#E8C882] mb-3">浏览中国历史</h3>
              <p class="text-[#F8F6F2]/90 text-base mb-6">探索五千年的文明演进</p>
              <button class="flex items-center gap-2 px-5 py-2.5 border-2 border-[#E8C882]/60 hover:border-[#E8C882] hover:bg-[#E8C882]/10 text-[#E8C882] text-sm rounded-full transition-colors">
                <span>进入探索</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>

          <div 
            @click="navigateToFamily"
            class="relative cursor-pointer rounded-lg overflow-hidden h-[280px]"
            :class="visibleSections['explore-section'] ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
          >
            <div class="absolute inset-0">
              <img 
                src="/family-card-bg.png"
                alt="我的家族"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-[#4A4A3A]/20 via-transparent to-transparent"></div>
            </div>
            <div class="relative z-10 p-8">
              <h3 class="font-calligraphy text-3xl text-[#4A4A3A] mb-3">浏览我的家族</h3>
              <p class="text-[#4A4A3A]/80 text-base leading-relaxed mb-6">记录家庭故事<br/>连接历史记忆</p>
              <button class="flex items-center gap-2 px-5 py-2.5 border-2 border-[#8B5A2B]/60 hover:border-[#8B5A2B] hover:bg-[#8B5A2B]/10 text-[#8B5A2B] text-sm rounded-full transition-colors">
                <span>进入家族树</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-8" data-animate="continue-header">
          <h2 class="font-calligraphy text-3xl text-[#355C5A] mb-2">继续探索</h2>
          <p class="text-sm text-[#4A4A3A]/70">发现更多精彩内容</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-5">
          <div 
            class="bg-white rounded-md overflow-hidden shadow-sm flex flex-col h-full"
            :class="visibleSections['continue-header'] ? 'animate-fade-up' : 'opacity-0'"
          >
            <div class="p-4 border-b border-[#355C5A]/10 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="text-sm font-medium text-[#2C2C2C]">今日历史</span>
              </div>
              <button @click="navigateToTimeline" class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A]">更多</button>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <div class="h-36 rounded-md overflow-hidden mb-3">
                <img 
                  :src="dailyEvent ? imageFor(dailyEvent.n, 'event') : ''"
                  :alt="dailyEvent ? dailyEvent.n : '今日历史'"
                  class="w-full h-full object-cover"
                />
              </div>
              <template v-if="dailyEvent">
                <div class="text-xs text-[#4A4A3A]/60 mb-1">{{ dailyEvent.s }}</div>
                <h4 class="font-calligraphy text-lg text-[#2C2C2C] mb-1">{{ dailyEvent.n }}</h4>
                <p class="text-sm text-[#4A4A3A]/80 line-clamp-2 mb-3 flex-1">{{ dailyEvent.o }}</p>
                <button @click="openDailyEvent" class="w-full py-2 text-sm text-[#355C5A] hover:bg-[#355C5A]/5 rounded-md transition-colors">查看详情</button>
              </template>
              <div v-else class="flex-1 flex items-center justify-center text-sm text-[#4A4A3A]/50">内容加载中…</div>
            </div>
          </div>

          <div 
            class="bg-white rounded-md overflow-hidden shadow-sm flex flex-col h-full"
            :class="visibleSections['continue-header'] ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
          >
            <div class="p-4 border-b border-[#C34739]/10 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span class="text-sm font-medium text-[#2C2C2C]">热门人物</span>
              </div>
              <button @click="navigateToTimeline" class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A]">更多</button>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div 
                  v-for="person in hotPersons" 
                  :key="person.i"
                  @click="navigateToPerson(person.i, person.l)"
                  class="cursor-pointer"
                >
                  <div class="aspect-[3/4] rounded-md overflow-hidden mb-2 bg-[#F5F2EC]">
                    <img :src="imageFor(person.n, 'person')" :alt="person.n" class="w-full h-full object-cover" />
                  </div>
                  <div class="text-center">
                    <span class="text-xs text-[#2C2C2C] block font-medium">{{ person.n }}</span>
                    <span class="text-xs text-[#4A4A3A]/60">{{ person.s.split(' · ')[0] }}</span>
                  </div>
                </div>
                <div v-if="!hotPersons.length" class="col-span-4 py-10 text-center text-sm text-[#4A4A3A]/50">
                  人物数据加载中…
                </div>
              </div>
              <button @click="navigateToTimeline" class="w-full py-2 text-sm text-[#C34739] hover:bg-[#C34739]/5 rounded-md transition-colors mt-auto">全部人物</button>
            </div>
          </div>

          <div 
            class="bg-white rounded-md overflow-hidden shadow-sm flex flex-col h-full"
            :class="visibleSections['continue-header'] ? 'animate-fade-up fade-up-delay-2' : 'opacity-0'"
          >
            <div class="p-4 border-b border-[#D8B26A]/20 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <span class="text-sm font-medium text-[#2C2C2C]">为你推荐</span>
              </div>
              <button @click="navigateToTimeline" class="text-xs text-[#4A4A3A]/60 hover:text-[#355C5A]">更多</button>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <div class="h-36 rounded-md overflow-hidden mb-3">
                <img 
                  :src="dailyDynasty ? imageFor(dailyDynasty.name, 'dynasty') : ''"
                  :alt="dailyDynasty ? dailyDynasty.name : '为你推荐'"
                  class="w-full h-full object-cover"
                />
              </div>
              <template v-if="dailyDynasty">
                <div class="text-[11px] text-[#D8B26A] mb-1 truncate">{{ recommendReason }}</div>
                <h4 class="font-calligraphy text-lg text-[#2C2C2C] mb-1">{{ dailyDynasty.name }} · {{ dailyDynasty.duration }}</h4>
                <p class="text-sm text-[#4A4A3A]/80 line-clamp-2 mb-3 flex-1">{{ dailyDynastyDesc }}</p>
                <button @click="openDailyDynasty" class="w-full py-2 text-sm text-[#C34739] hover:bg-[#C34739]/5 rounded-md transition-colors">开始探索</button>
              </template>
              <div v-else class="flex-1 flex items-center justify-center text-sm text-[#4A4A3A]/50">内容加载中…</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 px-8 bg-[#F5F2EC]/50">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-5" data-animate="statistics">
          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#355C5A]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ fmtNum(animatedNumbers['person_count']) }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">历史人物</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">正在不断丰富中</div>
          </div>

          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up fade-up-delay-1' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#C34739]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ fmtNum(animatedNumbers['event_count']) }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">历史事件</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">正在不断丰富中</div>
          </div>

          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up fade-up-delay-2' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#D8B26A]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-5 h-5 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ fmtNum(animatedNumbers['work_count']) }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">历史作品</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">正在不断丰富中</div>
          </div>

          <div 
            class="bg-white rounded-md p-6 text-center shadow-sm"
            :class="visibleSections['statistics'] ? 'animate-fade-up fade-up-delay-3' : 'opacity-0'"
          >
            <div class="w-12 h-12 rounded-md bg-[#5C7A5E]/10 flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-[#5C7A5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div class="font-calligraphy text-3xl md:text-4xl text-[#2C2C2C] mb-2">
              {{ fmtNum(animatedNumbers['family_count']) }}
            </div>
            <div class="text-base text-[#4A4A3A] font-medium">家族记忆</div>
            <div class="text-xs text-[#4A4A3A]/50 mt-1">等待你的记录</div>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-10 px-8 relative overflow-hidden bg-[#2C2C2C]/5">
      <div class="absolute inset-0 opacity-15">
        <img 
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20ink%20wash%20painting%20mountains%20river%20minimal%20traditional%20style&image_size=landscape_16_9"
          alt="Footer Background"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="relative z-10 max-w-4xl mx-auto text-center">
        <p class="font-calligraphy text-lg text-[#355C5A] mb-1">历史不会停留在书页</p>
        <p class="font-calligraphy text-lg text-[#355C5A] mb-1">它也存在于每一个家庭</p>
        <p class="font-calligraphy text-lg text-[#355C5A] mb-4">它也存于每一脉</p>
        <div class="flex items-center justify-center gap-3">
          <div class="w-10 h-10 rounded-md bg-gradient-to-br from-[#355C5A] to-[#C34739] flex items-center justify-center shadow-md">
            <svg viewBox="0 0 40 40" class="w-8 h-8">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#F8F6F2" stroke-width="1"/>
              <text x="20" y="25" text-anchor="middle" fill="#F8F6F2" font-size="16" font-family="'Ma Shan Zheng', cursive">千</text>
            </svg>
          </div>
          <span class="font-calligraphy text-xl text-[#2C2C2C] tracking-widest">千年一脉</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.glass-nav {
  background: rgba(248, 246, 242, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 20px rgba(44, 44, 44, 0.08);
}
</style>
