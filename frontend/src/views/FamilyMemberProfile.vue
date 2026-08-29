<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getMember, getAllMembers, getAllRelations,
  getLifeEventsByMember, getStoriesByMember, getHistoryLinksByMember, getPhotosByMember
} from '@/services/familyStore'
import { resolveHistoryTarget, recommendHistory, extractYear, type HistoryTargetInfo } from '@/services/historyResolver'
import type { FamilyMember, FamilyRelation, LifeEvent, FamilyStory, HistoryLink } from '@/types/family'

const route = useRoute()
const router = useRouter()
const memberId = computed(() => route.params.id as string)

const member = ref<FamilyMember | null>(null)
const allMembers = ref<FamilyMember[]>([])
const relations = ref<FamilyRelation[]>([])
const lifeEvents = ref<LifeEvent[]>([])
const stories = ref<FamilyStory[]>([])
const links = ref<HistoryLink[]>([])
const photoUrls = ref<string[]>([])
const loaded = ref(false)

const PALETTE = ['#355C5A', '#C34739', '#D8B26A', '#5C7A5E', '#4A6F7A', '#8B3A2B', '#2E4A48', '#A8835A']
function avatarBg(m: FamilyMember): string {
  if (m.avatarColor) return m.avatarColor
  let h = 0
  for (let i = 0; i < m.name.length; i++) h = (h * 31 + m.name.charCodeAt(i)) % PALETTE.length
  return PALETTE[h]
}
function yearsText(m: FamilyMember): string {
  const b = m.birthYear, d = m.deathYear
  if (b && d) return `${b}—${d}`
  if (b) return `${b}—`
  if (d) return `—${d}`
  return '生卒不详'
}
function relationLabel(m: FamilyMember): string {
  return m.isSelf ? '本人' : (m.relationToSelf || '家族成员')
}

/* ===================== 基本信息 ===================== */
const basicInfo = computed(() => {
  if (!member.value) return []
  const m = member.value
  return [
    { k: '出生年份', v: m.birthYear ?? '—' },
    { k: '去世年份', v: m.deathYear ?? '—' },
    { k: '出生地', v: m.birthPlace || '—' },
    { k: '居住地', v: m.residence || '—' },
    { k: '职业', v: m.occupation || '—' },
    { k: '与我的关系', v: m.relationToSelf || '—' }
  ]
})

/* ===================== 人生经历（横向时间轴 · 蛇形S型回环） ===================== */
const sortedLifeEvents = computed(() => {
  const evs = lifeEvents.value.slice()
  evs.sort((a, b) => (parseInt(a.year || '0', 10) || 0) - (parseInt(b.year || '0', 10) || 0))
  return evs
})
const timelineNodes = computed(() => {
  const nodes: { year: string; label: string }[] = []
  if (member.value?.birthYear != null) nodes.push({ year: String(member.value.birthYear), label: '出生' })
  for (const ev of sortedLifeEvents.value) nodes.push({ year: ev.year || '—', label: ev.title })
  if (member.value?.deathYear != null) nodes.push({ year: String(member.value.deathYear), label: '离世' })
  return nodes
})
/* 蛇形S型回环：每行最多 PER_ROW 个节点，奇偶行反向折返，完整显示不截断 */
const PER_ROW = 4
const snakeRows = computed(() => {
  const rows: { year: string; label: string }[][] = []
  for (let i = 0; i < timelineNodes.value.length; i += PER_ROW) {
    let chunk = timelineNodes.value.slice(i, i + PER_ROW)
    if (rows.length % 2 === 1) chunk = chunk.slice().reverse()
    rows.push(chunk)
  }
  return rows
})

/* ===================== 他所处的时代（人生 ────→ 大历史） ===================== */
interface EraRow {
  lifeYear: number
  lifeLabel: string
  target: HistoryTargetInfo | null
  isLinked: boolean
}
const resolvedLinks = computed(() => links.value
  .map(l => ({ link: l, info: resolveHistoryTarget(l.targetType, l.targetId) }))
  .filter(x => x.info))

const eraRows = computed<EraRow[]>(() => {
  if (!member.value) return []
  const m = member.value
  const rows: EraRow[] = resolvedLinks.value.map(x => ({
    lifeYear: extractYear(x.info!.year) ?? m.birthYear ?? 0,
    lifeLabel: '历史关联',
    target: x.info!,
    isLinked: true
  }))
  const usedYears = new Set(rows.map(r => r.lifeYear))
  const nodes: { year: number; label: string }[] = []
  if (m.birthYear != null) nodes.push({ year: m.birthYear, label: '出生' })
  for (const ev of sortedLifeEvents.value) {
    const y = parseInt(ev.year || '', 10)
    if (!isNaN(y)) nodes.push({ year: y, label: ev.title })
  }
  if (m.deathYear != null) nodes.push({ year: m.deathYear, label: '离世' })
  nodes.sort((a, b) => a.year - b.year)
  for (const n of nodes) {
    if (usedYears.has(n.year)) continue
    usedYears.add(n.year)
    const recs = recommendHistory({
      birthYear: n.year,
      deathYear: n.year,
      exclude: links.value.map(l => ({ type: l.targetType, id: l.targetId })),
      limit: 4
    })
    const best = recs[0]
    if (best) {
      rows.push({
        lifeYear: n.year, lifeLabel: n.label,
        target: {
          name: best.name, dynasty: best.dynasty, year: best.year,
          path: best.type === 'event' ? `/event/${best.id}` : `/person/${best.id}`
        },
        isLinked: false
      })
    } else {
      rows.push({ lifeYear: n.year, lifeLabel: n.label, target: null, isLinked: false })
    }
  }
  rows.sort((a, b) => a.lifeYear - b.lifeYear)
  return rows.slice(0, 8)
})
function gotoFirstEra() {
  const r = eraRows.value.find(x => x.target)
  if (r?.target) router.push(r.target.path)
}

/* ===================== 人生经历 · 蛇形连贯曲线（SVG 动态绘制） ===================== */
const tlContainer = ref<HTMLElement | null>(null)
const dotRefs = ref<(HTMLElement | null)[][]>([])
const pathD = ref('')
function setDotRef(ri: number, ci: number, el: unknown) {
  if (!dotRefs.value[ri]) dotRefs.value[ri] = []
  dotRefs.value[ri][ci] = (el as HTMLElement | null)
}
function computePath() {
  if (!tlContainer.value) return
  const c = tlContainer.value.getBoundingClientRect()
  const w = c.width
  // 蛇形流向收集圆点中心坐标（奇数行反向），并记录所在行号
  const pts: { x: number; y: number; ri: number }[] = []
  for (let ri = 0; ri < snakeRows.value.length; ri++) {
    const row = snakeRows.value[ri]
    const idxs = ri % 2 === 0
      ? row.map((_, ci) => ci)
      : row.map((_, ci) => row.length - 1 - ci)
    for (const ci of idxs) {
      const el = dotRefs.value[ri]?.[ci]
      if (!el) continue
      const r = el.getBoundingClientRect()
      pts.push({ x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top, ri })
    }
  }
  if (!pts.length) { pathD.value = ''; return }
  // 折返曲线沿容器左右边缘留白 lane 走「U型括号」绕行，绝不横穿圆点下方的年份/卡片文字
  const LANE = 16 // 折返竖向 lane 距容器左右边缘的距离（需与容器 px-8 留白匹配）
  const R = 10    // 折返圆角半径
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i]
    if (p.ri === q.ri) {
      // 同行：在圆点高度水平连接（年份/卡片在圆点下方，互不遮挡）
      d += ` L ${q.x.toFixed(1)} ${q.y.toFixed(1)}`
      continue
    }
    // 跨行折返：偶数行在右侧 lane 折返、奇数行在左侧 lane 折返
    const useRightLane = p.ri % 2 === 0
    const laneX = useRightLane ? w - LANE : LANE
    if (useRightLane) {
      if (p.x < laneX - R) d += ` L ${(laneX - R).toFixed(1)} ${p.y.toFixed(1)}`
      d += ` Q ${laneX.toFixed(1)} ${p.y.toFixed(1)}, ${laneX.toFixed(1)} ${(p.y + R).toFixed(1)}`
      if (q.y - R > p.y + R) d += ` L ${laneX.toFixed(1)} ${(q.y - R).toFixed(1)}`
      d += ` Q ${laneX.toFixed(1)} ${q.y.toFixed(1)}, ${(laneX - R).toFixed(1)} ${q.y.toFixed(1)}`
      if (q.x < laneX - R) d += ` L ${q.x.toFixed(1)} ${q.y.toFixed(1)}`
    } else {
      if (p.x > laneX + R) d += ` L ${(laneX + R).toFixed(1)} ${p.y.toFixed(1)}`
      d += ` Q ${laneX.toFixed(1)} ${p.y.toFixed(1)}, ${laneX.toFixed(1)} ${(p.y + R).toFixed(1)}`
      if (q.y - R > p.y + R) d += ` L ${laneX.toFixed(1)} ${(q.y - R).toFixed(1)}`
      d += ` Q ${laneX.toFixed(1)} ${q.y.toFixed(1)}, ${(laneX + R).toFixed(1)} ${q.y.toFixed(1)}`
      if (q.x > laneX + R) d += ` L ${q.x.toFixed(1)} ${q.y.toFixed(1)}`
    }
  }
  pathD.value = d
}

/* ===================== 加载 ===================== */
async function load() {
  const m = await getMember(memberId.value)
  if (!m) { loaded.value = true; return }
  member.value = m
  allMembers.value = await getAllMembers()
  relations.value = await getAllRelations()
  lifeEvents.value = await getLifeEventsByMember(m.id)
  stories.value = await getStoriesByMember(m.id)
  links.value = await getHistoryLinksByMember(m.id)
  // 照片
  photoUrls.value.forEach(u => URL.revokeObjectURL(u))
  const photos = await getPhotosByMember(m.id)
  photoUrls.value = photos.map(p => URL.createObjectURL(p.blob))
  loaded.value = true
  await nextTick()
  computePath()
}

function onResize() { computePath() }
onMounted(() => { window.addEventListener('resize', onResize); load() })
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  photoUrls.value.forEach(u => URL.revokeObjectURL(u))
})
watch(() => route.params.id, () => { load() })
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative pb-16">
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

    <template v-if="member && loaded">
      <!-- 顶部导航（统一面包屑） -->
      <nav class="sticky top-0 z-50 backdrop-blur-md bg-[#F8F6F2]/85 border-b border-[#D8B26A]/20">
        <div class="max-w-6xl mx-auto px-8 py-3 flex items-center">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
              <div class="w-8 h-8 rounded-full bg-[#C34739] flex items-center justify-center">
                <span class="font-calligraphy text-white text-lg">千</span>
              </div>
              <span class="font-calligraphy text-xl text-[#2C2C2C]">千年一脉</span>
            </div>
            <div class="h-5 w-px bg-[#D8B26A]/30"></div>
            <div class="text-sm text-[#4A4A3A]/60">
              <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/')">首页</span>
              <span class="mx-1.5 text-[#D8B26A]/40">›</span>
              <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/family')">家族记忆</span>
              <span class="mx-1.5 text-[#D8B26A]/40">›</span>
              <span class="text-[#2C2C2C] font-medium">{{ member.name }}</span>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-6xl mx-auto px-8 pt-8">

        <!-- 人物信息头（紧凑左右布局 · 编辑档案在右上角） -->
        <section class="relative flex items-center gap-8 pb-7 pr-36">
          <div class="relative shrink-0">
            <div
              class="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg ring-4 ring-white/70"
              :style="{ background: avatarBg(member) }"
            >
              <img v-if="member.avatarDataUrl" :src="member.avatarDataUrl" class="w-full h-full rounded-full object-cover" alt="" />
              <span v-else class="font-calligraphy text-4xl">{{ member.name.charAt(0) }}</span>
            </div>
            <span
              v-if="member.isSelf"
              class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-vermillion text-white text-[10px] shadow"
            >本人</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-4 flex-wrap">
              <h1 class="font-calligraphy text-4xl text-[#2C2C2C] tracking-wider">{{ member.name }}</h1>
              <span class="text-base text-[#4A4A3A]/70 font-light">{{ yearsText(member) }}</span>
            </div>
            <div class="mt-2 flex items-center gap-3 flex-wrap">
              <span
                class="px-2.5 py-0.5 rounded-full border text-xs"
                :class="member.isSelf ? 'border-vermillion/40 text-vermillion bg-vermillion/5' : 'border-[#355C5A]/30 text-[#355C5A] bg-[#355C5A]/5'"
              >{{ relationLabel(member) }}</span>
              <span v-if="member.gender" class="text-xs text-[#4A4A3A]/55">{{ member.gender }}</span>
              <span v-if="member.occupation" class="text-xs text-[#4A4A3A]/55">{{ member.occupation }}</span>
              <span v-if="member.birthPlace" class="text-xs text-[#4A4A3A]/55">籍贯 · {{ member.birthPlace }}</span>
            </div>
            <p
              v-if="member.bio"
              class="mt-3 text-sm text-[#4A4A3A]/75 leading-relaxed border-l-2 border-[#D8B26A]/40 pl-3 font-serif"
            >{{ member.bio }}</p>
            <p v-else class="mt-3 text-sm text-[#4A4A3A]/45 font-serif">这位家人的故事还没有被记录，点击右上角「编辑档案」补全他的人生轨迹。</p>
          </div>
          <button
            class="absolute top-1 right-0 px-4 py-1.5 rounded-full bg-dai-blue text-white text-sm hover:bg-dai-blue/85 transition-colors"
            @click="router.push(`/family/member/${member.id}/edit`)"
          >编辑档案</button>
        </section>

        <!-- 基本信息 + 人生经历（左右两栏） -->
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-10 pt-6 border-t border-[#D8B26A]/15">
          <!-- 基本信息 -->
          <section class="lg:col-span-2">
            <h2 class="font-serif text-lg text-ink-black mb-4 flex items-center gap-2.5">
              <span class="w-1 h-5 bg-[#5C7A5E] rounded-full"></span>基本信息
            </h2>
            <div class="grid grid-cols-1 gap-y-3">
              <div v-for="it in basicInfo" :key="it.k" class="flex items-baseline justify-between gap-4 border-b border-ink-black/5 pb-2">
                <span class="text-[13px] text-ink-black/50 shrink-0">{{ it.k }}</span>
                <span class="text-[13px] text-ink-black font-medium text-right">{{ it.v }}</span>
              </div>
            </div>
          </section>

          <!-- 人生经历 -->
          <section class="lg:col-span-3">
            <h2 class="font-serif text-lg text-ink-black mb-6 flex items-center gap-2.5">
              <span class="w-1 h-5 bg-[#C34739] rounded-full"></span>人生经历
            </h2>
            <div v-if="!timelineNodes.length" class="py-8 text-center text-sm text-ink-black/40">
              还没有人生经历记录
            </div>
            <!-- 蛇形S型连贯曲线时间轴：SVG 动态绘制完整曲线，节点间无缝衔接 -->
            <div v-else ref="tlContainer" class="relative px-8 pt-3 pb-4">
              <svg v-if="pathD" class="absolute inset-0 w-full h-full pointer-events-none">
                <path :d="pathD" fill="none" stroke="#C34739" stroke-opacity="0.45" stroke-width="2" stroke-linecap="round" />
              </svg>
              <template v-for="(row, ri) in snakeRows" :key="ri">
                <div class="relative flex items-start justify-between gap-2">
                  <div
                    v-for="(n, ci) in row"
                    :key="ci"
                    class="flex-1 flex flex-col items-center min-w-0"
                  >
                    <div :ref="(el) => setDotRef(ri, ci, el)" class="w-3.5 h-3.5 rounded-full bg-vermillion ring-4 ring-vermillion/15 shrink-0 z-10"></div>
                    <div class="mt-3 text-xs font-medium text-vermillion">{{ n.year }}</div>
                    <div class="mt-1 text-sm text-ink-black/80 text-center max-w-full px-1 break-words">{{ n.label }}</div>
                  </div>
                </div>
                <div v-if="ri < snakeRows.length - 1" class="h-14"></div>
              </template>
            </div>
          </section>
        </div>

        <!-- 关于他的记忆 -->
        <section class="pt-8 mt-8 border-t border-[#D8B26A]/15">
          <h2 class="font-serif text-lg text-ink-black mb-5 flex items-center gap-2.5">
            <span class="w-1 h-5 bg-[#D8B26A] rounded-full"></span>关于他的记忆
          </h2>

          <div class="grid grid-cols-3 gap-4 mb-6">
            <div
              v-for="i in 3"
              :key="i"
              class="aspect-[4/3] rounded-xl border border-ink-black/10 overflow-hidden bg-white/60 flex items-center justify-center"
            >
              <img
                v-if="photoUrls[i - 1]"
                :src="photoUrls[i - 1]"
                class="w-full h-full object-cover"
                alt="家族照片"
              />
              <div v-else class="flex flex-col items-center gap-2 text-ink-black/30">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm4 4a2 2 0 114 0 2 2 0 01-4 0zm8 5l-3.5-4L9 17"></path>
                </svg>
                <span class="text-xs">照片待补</span>
              </div>
            </div>
          </div>

          <div v-if="!stories.length" class="py-8 text-center text-sm text-ink-black/35 border border-dashed border-[#D8B26A]/30 rounded-lg bg-white/40">
            还没有家人的故事，可在「编辑档案」中写下关于他/她的记忆
          </div>
          <div v-else class="space-y-4">
            <div v-for="s in stories" :key="s.id" class="rounded-xl border border-[#D8B26A]/20 bg-white/50 p-5">
              <div class="flex items-center gap-3 mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#D8B26A]"></span>
                <h3 class="text-base font-medium text-ink-black">{{ s.title }}</h3>
                <span v-if="s.year" class="text-xs text-ink-black/45">{{ s.year }}</span>
              </div>
              <p class="text-sm text-ink-black/70 leading-relaxed whitespace-pre-line font-serif">{{ s.content }}</p>
            </div>
          </div>
        </section>

        <!-- 他所处的时代 -->
        <section class="pt-8 mt-8 border-t border-[#D8B26A]/15">
          <h2 class="font-serif text-lg text-ink-black mb-1.5 flex items-center gap-2.5">
            <span class="w-1 h-5 bg-[#355C5A] rounded-full"></span>他所处的时代
          </h2>
          <p class="text-sm text-ink-black/45 mb-6">他/她的人生，与大历史交汇的时刻</p>

          <div v-if="!eraRows.length" class="py-8 text-center text-sm text-ink-black/35 border border-dashed border-[#D8B26A]/30 rounded-lg bg-white/40">
            暂无人生年份记录，无法对照时代
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(row, i) in eraRows"
              :key="i"
              class="flex items-center gap-4"
            >
              <div class="w-36 shrink-0 text-right">
                <div class="text-sm font-medium text-vermillion">{{ row.lifeYear }}</div>
                <div class="text-xs text-ink-black/50 truncate">{{ row.lifeLabel }}</div>
              </div>
              <div class="flex-1 flex items-center gap-2 min-w-0">
                <span class="flex-1 border-t border-dashed border-ink-black/20"></span>
                <svg class="w-4 h-4 text-[#355C5A]/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </div>
              <div class="w-56 shrink-0 text-left">
                <template v-if="row.target">
                  <button
                    class="text-sm text-[#355C5A] hover:text-[#C34739] font-medium truncate block transition-colors"
                    @click="router.push(row.target.path)"
                  >{{ row.target.name }}</button>
                  <div class="text-xs text-ink-black/45">{{ row.target.year }} · {{ row.target.dynasty }}</div>
                </template>
                <div v-else class="text-xs text-ink-black/30">（大历史待收录）</div>
              </div>
            </div>
          </div>

          <div v-if="eraRows.some(r => r.target)" class="mt-7 text-center">
            <button
              class="px-7 py-2.5 rounded-full bg-vermillion text-white text-sm hover:bg-vermillion/85 hover:shadow-lg transition-all"
              @click="gotoFirstEra"
            >查看历史</button>
          </div>
        </section>

        <footer class="pt-12 pb-8 text-center border-t border-[#D8B26A]/15 mt-12">
          <div class="font-calligraphy text-2xl text-[#4A4A3A]/40 mb-2">千年一脉</div>
          <p class="text-xs text-[#4A4A3A]/40">历史不会停留在书页，它也存在于每一个家庭</p>
        </footer>
      </div>
    </template>

    <div v-else-if="loaded" class="min-h-[60vh] flex items-center justify-center">
      <div class="text-center">
        <p class="font-serif text-2xl text-ink-black/60 mb-2">未找到这位家人</p>
        <button class="px-6 py-2.5 rounded-full bg-vermillion text-white text-sm mt-4" @click="router.push('/family')">返回家族树</button>
      </div>
    </div>
  </div>
</template>
