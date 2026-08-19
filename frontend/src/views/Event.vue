<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { events, persons, dynasties, eventTimelines } from '@/mock/data'
import { loadDynastyData, type DynastyData } from '@/services/dynastyDataService'
import ComingSoon from '@/components/ComingSoon.vue'
import * as echarts from 'echarts'

const route = useRoute()
const router = useRouter()
const relationGraphRef = ref<HTMLElement | null>(null)
const relationGraphWidth = ref(800)
const relationGraphHeight = ref(420)
const impactChartRef = ref<HTMLElement | null>(null)
let impactChart: echarts.ECharts | null = null
const isLoaded = ref(false)
const exploreTab = ref<'person' | 'event'>('person')

// 从事件ID推断朝代ID (204001 -> 尝试201)
// 事件ID规则: dynasty_prefix = Math.floor(eventId / 1000) 但实际可能不对应
// 因此采用尝试加载策略
const eventId = Number(route.params.id) || 1002
const jsonData = ref<DynastyData | null>(null)

// 尝试可能的朝代ID列表（基于事件ID前缀和知识库）
function getCandidateDynastyIds(eventId: number): number[] {
  const prefix = Math.floor(eventId / 1000)
  const candidates = [prefix]  // 默认：ID前3位
  // 添加可能的关联朝代（如事件204xxx属于朝代201）
  if (prefix >= 200) {
    candidates.push(201)  // 夏商西周
  }
  return [...new Set(candidates)]
}

const onPersonImageError = (e: Event, name: string) => {
  const person = getPersonByName(name)
  const img = e.target as HTMLImageElement
  if (person) {
    img.src = `https://picsum.photos/seed/person${person.id}/200/200`
  }
  img.onerror = null
}

const hasPersonImage = (name: string) => {
  const person = getPersonByName(name)
  return !!person?.image_url
}

// 优先从 JSON 数据查找事件
const event = computed(() => {
  if (jsonData.value) {
    const found = jsonData.value.events.find(e => e.id === eventId)
    if (found) return found
  }
  return events.find(e => e.id === eventId)
})
const hasData = computed(() => event.value !== undefined)

const formattedYear = (year: number | null | undefined) => {
  if (year === null || year === undefined) return '不详'
  if (year < 0) return `前${Math.abs(year)}年`
  return `${year}年`
}

const duration = computed(() => {
  if (!event.value) return ''
  const s = event.value.start_year
  const e = event.value.end_year
  if (s === e) return formattedYear(s)
  return `${formattedYear(s)} — ${formattedYear(e)}`
})

const getPersonByName = (name: string) => {
  if (jsonData.value) {
    const found = jsonData.value.persons.find(p => p.name === name)
    if (found) return found
  }
  return persons.find(p => p.name === name)
}

const validRelatedPersons = computed(() => {
  const allPersons = jsonData.value?.persons || persons
  return (event.value?.related_persons || []).filter(name =>
    allPersons.some(p => p.name === name)
  ).slice(0, 6)
})

const leaders = computed(() => event.value?.person_groups?.leaders || [])
const participants = computed(() => event.value?.person_groups?.participants || [])
const opponents = computed(() => event.value?.person_groups?.opponents || [])
const affected = computed(() => event.value?.person_groups?.affected || [])

const narratives = computed(() => event.value?.narratives || [])
const background = computed(() => event.value?.background || {})
const impacts = computed(() => event.value?.impacts || [])
const chain = computed(() => event.value?.chain || [])

const timeline = computed(() => {
  const g = event.value
  if (!g) return null

  // First try dynasty-level timeline from JSON data
  if (jsonData.value?.timelines && g.timeline_id) {
    const dynTls = jsonData.value.timelines
    if (dynTls[g.timeline_id]) {
      return dynTls[g.timeline_id].map((entry, idx) => ({
        ...entry,
        index: idx,
        isCurrent: entry.event_id === g.id
      }))
    }
  }

  // Then try mock data timeline
  if (g.timeline_id && eventTimelines[g.timeline_id]) {
    const tl = eventTimelines[g.timeline_id]
    return tl.map((entry, idx) => ({
      ...entry,
      index: idx,
      isCurrent: entry.event_id === g.id
    }))
  }

  // Fallback: use chain data
  const chainData = g.chain || []
  if (chainData.length === 0) return null
  return chainData.map((entry, idx) => ({
    title: entry.title,
    year: entry.year,
    type: entry.type,
    color: entry.color,
    event_id: (jsonData.value?.events || events).find(e => e.name === entry.title)?.id,
    isCurrent: entry.title === g.name,
    index: idx
  }))
})

const navigateToChainEvent = (title: string) => {
  const target = (jsonData.value?.events || events).find(e => e.name === title)
  if (target) router.push(`/event/${target.id}`)
}

const chainEventExists = (title: string) => {
  return (jsonData.value?.events || events).some(e => e.name === title)
}

const relatedEventsData = computed(() => {
  if (!event.value?.related_events?.length) return []
  const allEvents = jsonData.value?.events || events
  return event.value.related_events
    .map(name => allEvents.find(e => e.name === name))
    .filter((e): e is NonNullable<typeof e> => e !== undefined && e.id !== event.value!.id)
    .slice(0, 6)
})

const relatedDynasty = computed(() => {
  if (!event.value) return null
  return dynasties.find(d => d.name === event.value!.dynasty) || null
})

const navigateToPerson = (name: string) => {
  const p = getPersonByName(name)
  if (p) router.push(`/person/${p.id}`)
}

const navigateToEvent = (id: number) => router.push(`/event/${id}`)
const navigateToDynasty = () => {
  const d = relatedDynasty.value
  if (d) router.push(`/dynasty/${d.id}`)
}
const navigateToDynastyEvents = () => {
  const d = relatedDynasty.value
  if (d) router.push(`/dynasty/${d.id}/events`)
}

// ========== 叙事关系图谱 (Custom SVG) ==========
interface GraphNode {
  id: string
  name: string
  x: number; y: number; w: number; h: number
  type: 'center' | 'person' | 'event'
  role: string
  subset: string
  personId?: number
  eventId?: number
}

interface GraphEdge {
  source: GraphNode
  target: GraphNode
  label: string
  color: string
  isCore?: boolean
  isPersonRelation?: boolean
}

const nodeColorMap: Record<string, { bg: string; border: string; text: string }> = {
  center: { bg: '#C34739', border: '#C34739', text: '#FFFFFF' },
  person: { bg: '#FDFBF7', border: '#C34739', text: '#2C2C2C' },
  event: { bg: '#F8F6F2', border: '#355C5A', text: '#2C2C2C' }
}

const roleColors: Record<string, string> = {
  '领导者': '#C34739',
  '参与者': '#355C5A',
  '对手': '#8B5A2B',
  '受影响': '#5C7A5E'
}

const sizeMap: Record<string, { w: number; h: number; rx: number; fontSize: number }> = {
  center: { w: 130, h: 56, rx: 10, fontSize: 18 },
  large: { w: 110, h: 46, rx: 8, fontSize: 14 },
  medium: { w: 96, h: 40, rx: 7, fontSize: 13 },
  small: { w: 80, h: 34, rx: 6, fontSize: 11 }
}

const eventGraphNodes = computed<GraphNode[]>(() => {
  if (!event.value) return []
  const g = event.value
  const nodes: GraphNode[] = []
  const cx = relationGraphWidth.value / 2
  const cy = relationGraphHeight.value / 2

  // Center event node
  nodes.push({
    id: '__center__', name: g.name,
    x: cx - 65, y: cy - 28,
    w: 130, h: 56, type: 'center',
    role: '中心事件', subset: 'center'
  })

  const groups = g.person_groups
  if (!groups) return nodes

  // Collect ALL persons: leaders + participants + opponents + affected
  const personEntries: Array<{ name: string; role: string; subset: string }> = []
  const seen = new Set<string>()
  const add = (name: string, label: string, subset: string) => {
    if (seen.has(name)) return
    seen.add(name)
    personEntries.push({ name, role: label, subset })
  }
  groups.leaders?.slice(0, 4).forEach(p => add(p.name, p.role || '领导者', '领导者'))
  groups.participants?.slice(0, 4).forEach(p => add(p.name, p.role || '参与者', '参与者'))
  groups.opponents?.slice(0, 4).forEach(p => add(p.name, p.role || '对手', '对手'))
  groups.affected?.slice(0, 3).forEach(p => add(p.name, p.role || '受影响', '受影响'))

  const leaders = personEntries.filter(e => e.subset === '领导者')
  const participants = personEntries.filter(e => e.subset === '参与者')
  const opponents = personEntries.filter(e => e.subset === '对手')
  const affected = personEntries.filter(e => e.subset === '受影响')

  const layoutRow = (entries: typeof personEntries, baseY: number, nodeSize: 'medium' | 'small' = 'medium') => {
    if (entries.length === 0) return
    const sz = sizeMap[nodeSize]
    const gap = entries.length > 4 ? 130 : 150
    const totalW = (entries.length - 1) * gap
    const startX = cx - totalW / 2
    entries.forEach((entry, i) => {
      const px = startX + i * gap - sz.w / 2
      const py = baseY - sz.h / 2
      const p = getPersonByName(entry.name)
      nodes.push({
        id: `person_${entry.name}`, name: entry.name,
        x: px, y: py, w: sz.w, h: sz.h,
        type: 'person', role: entry.role, subset: entry.subset,
        personId: p?.id
      })
    })
  }

  // Layout: leaders top, participants upper-middle, opponents lower-middle, affected bottom
  const hasPersons = personEntries.length > 0
  if (hasPersons) {
    if (leaders.length > 0) layoutRow(leaders, cy - 170, 'medium')
    if (participants.length > 0) layoutRow(participants, cy - 85, 'small')
    if (opponents.length > 0) layoutRow(opponents, cy + 85, 'medium')
    if (affected.length > 0) layoutRow(affected, cy + 170, 'small')
  }

  // Chain events: 1 cause + 1-2 consequence
  const chain = g.chain || []
  const allEvents = jsonData.value?.events || events
  const causeEvents = chain.filter(c => c.type === 'cause' && chainEventExists(c.title)).slice(0, 1)
  const consequenceEvents = chain.filter(c => (c.type === 'consequence' || c.type === 'later') && chainEventExists(c.title)).slice(0, 2)

  const chainLeftX = 50
  const chainRightX = relationGraphWidth.value - 135
  const chainMidY = cy

  causeEvents.forEach((c, i) => {
    const ev = allEvents.find(e => e.name === c.title)
    nodes.push({
      id: `chain_${c.title}`, name: c.title,
      x: chainLeftX, y: chainMidY - 30 + i * 70,
      w: 85, h: 34, type: 'event',
      role: '前置', subset: '前置',
      eventId: ev?.id
    })
  })

  consequenceEvents.forEach((c, i) => {
    const ev = allEvents.find(e => e.name === c.title)
    nodes.push({
      id: `chain_${c.title}`, name: c.title,
      x: chainRightX, y: chainMidY - 30 + i * 70,
      w: 85, h: 34, type: 'event',
      role: '后续', subset: '后续',
      eventId: ev?.id
    })
  })

  return nodes
})

const eventGraphEdges = computed<GraphEdge[]>(() => {
  if (!event.value) return []
  const nodes = eventGraphNodes.value
  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const edges: GraphEdge[] = []

  const personNodes = nodes.filter(n => n.type === 'person')

  // Center → person: show ALL labels
  personNodes.forEach(pn => {
    edges.push({
      source: nodeMap.get('__center__')!,
      target: pn,
      label: pn.role,
      color: roleColors[pn.subset] || '#4A4A3A',
      isCore: true
    })
  })

  // Person relations:最多4条
  const labelMap: Record<string, string> = {
    alliance: '联盟', hostile: '敌对', lord_vassal: '君臣',
    kinship: '亲属', teacher_student: '师生', friend: '朋友', support: '支持'
  }
  const colorMap: Record<string, string> = {
    alliance: '#5C7A5E', hostile: '#C34739', lord_vassal: '#D8B26A',
    kinship: '#D4756A', teacher_student: '#4A6F7A', friend: '#4A4A3A', support: '#355C5A'
  }
  const rels = (event.value!.person_relations || []).filter(rel =>
    personNodes.some(n => n.name === rel.source) && personNodes.some(n => n.name === rel.target)
  ).slice(0, 4)
  rels.forEach(rel => {
    const src = personNodes.find(n => n.name === rel.source)!
    const tgt = personNodes.find(n => n.name === rel.target)!
    edges.push({
      source: src, target: tgt,
      label: labelMap[rel.type] || rel.type,
      color: colorMap[rel.type] || '#4A4A3A',
      isPersonRelation: true
    })
  })

  // Center → chain events
  const chainNodes = nodes.filter(n => n.type === 'event')
  chainNodes.forEach(cn => {
    const isCause = cn.subset === '前置'
    edges.push({
      source: isCause ? cn : nodeMap.get('__center__')!,
      target: isCause ? nodeMap.get('__center__')! : cn,
      label: cn.subset,
      color: isCause ? '#8B5A2B' : '#355C5A'
    })
  })

  return edges
})

function getEdgePath(src: GraphNode, tgt: GraphNode): string {
  const sx = src.x + src.w / 2; const sy = src.y + src.h / 2
  const tx = tgt.x + tgt.w / 2; const ty = tgt.y + tgt.h / 2
  const midY = (sy + ty) / 2
  return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`
}

/**
 * 计算标签位置，带碰撞检测
 * 1. 沿连线 55% 位置作为初始点（无偏移，紧贴连线）
 * 2. 检测是否与任意人物节点矩形重叠
 * 3. 若重叠，选择推离距离最小的方向（上/下/左/右）推离
 * 4. 最多迭代 3 轮，收敛到无碰撞位置
 */
function computeEdgeLabelPos(
  src: GraphNode,
  tgt: GraphNode,
  allNodes: GraphNode[]
): { x: number; y: number } {
  const sx = src.x + src.w / 2; const sy = src.y + src.h / 2
  const tx = tgt.x + tgt.w / 2; const ty = tgt.y + tgt.h / 2
  const t = 0.55
  let x = sx + (tx - sx) * t
  let y = sy + (ty - sy) * t

  // Collision detection: check against all person nodes
  const labelW = 48, labelH = 18
  const margin = 3
  const personNodes = allNodes.filter(n => n.type === 'person')

  for (let attempt = 0; attempt < 3; attempt++) {
    let collided = false
    let pushX = 0, pushY = 0
    let minPush = Infinity

    for (const node of personNodes) {
      // Label AABB
      const lx = x - labelW / 2 - margin
      const ly = y - labelH / 2 - margin
      const lx2 = x + labelW / 2 + margin
      const ly2 = y + labelH / 2 + margin
      // Node AABB
      const nx = node.x, ny = node.y
      const nx2 = node.x + node.w, ny2 = node.y + node.h

      // Check AABB overlap
      if (lx < nx2 && lx2 > nx && ly < ny2 && ly2 > ny) {
        collided = true
        // Evaluate 4 push directions, pick the smallest
        const pushes = [
          { dx: nx2 - lx, dy: 0 },
          { dx: nx - lx2, dy: 0 },
          { dx: 0, dy: ny2 - ly },
          { dx: 0, dy: ny - ly2 }
        ]
        for (const p of pushes) {
          const dist = Math.abs(p.dx) + Math.abs(p.dy)
          if (dist < minPush) {
            minPush = dist
            pushX = p.dx
            pushY = p.dy
          }
        }
      }
    }

    if (!collided) break
    x += pushX
    y += pushY
  }

  return { x, y }
}

// Computed cache: 每个标签的碰撞检测后坐标
const edgeLabelPositions = computed(() => {
  const positions = new Map<string, { x: number; y: number }>()
  const allNodes = eventGraphNodes.value
  const edges = eventGraphEdges.value
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]
    if (!edge.label) continue
    positions.set(`el${i}`, computeEdgeLabelPos(edge.source, edge.target, allNodes))
  }
  return positions
})

function handleGraphResize() {
  if (relationGraphRef.value) {
    const rect = relationGraphRef.value.getBoundingClientRect()
    relationGraphWidth.value = Math.max(500, rect.width - 40)
    relationGraphHeight.value = Math.max(440, Math.min(520, rect.width * 0.55))
  }
}

const impactIcons: Record<string, string> = {
  '政治影响': '🏛️',
  '历史影响': '📜',
  '文化影响': '🎭',
  '社会影响': '👥'
}

const getImpactSummary = () => {
  if (!event.value) return ''
  const g = event.value
  const imps = impacts.value
  const topImp = imps.length > 0 ? [...imps].sort((a, b) => b.score - a.score)[0] : null
  const dynasty = g.dynasty
  const name = g.name

  if (topImp) {
    return `${name}作为${dynasty}时期的标志性事件，在${topImp.name}方面影响最为深远（${topImp.score}分），其历史余韵贯穿后世，成为理解${dynasty}兴衰脉络的重要切入点。`
  }
  return `${name}是${dynasty}时期的重要历史事件，其影响波及政治、社会与文化等多个层面，在中国历史进程中留下了深刻印记。`
}

const initImpactChart = () => {
  if (!impactChartRef.value) return
  if (impactChart) impactChart.dispose()
  try {
    impactChart = echarts.init(impactChartRef.value)
    const colors = ['#C34739', '#355C5A', '#D8B26A', '#5C7A5E']
    const data = impacts.value.map((i, idx) => ({
      value: i.score,
      itemStyle: {
        color: colors[idx % 4],
        borderRadius: [0, 8, 8, 0]
      }
    }))
    const yLabels = impacts.value.map(i => {
      const icon = impactIcons[i.name] || '📊'
      return `{icon|${icon}} {name|${i.name}}`
    })
    impactChart.setOption({
      grid: { left: 10, right: 50, top: 10, bottom: 20 },
      tooltip: { show: false },
      xAxis: {
        type: 'value',
        max: 100,
        show: false
      },
      yAxis: {
        type: 'category',
        data: yLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          rich: {
            icon: { fontSize: 16, padding: [0, 6, 0, 0] },
            name: { color: '#4A4A3A', fontSize: 13, fontWeight: 500 }
          }
        }
      },
      series: [{
        type: 'bar',
        data: data,
        barWidth: 16,
        label: {
          show: true,
          position: 'right',
          formatter: '{c}',
          color: '#2C2C2C',
          fontSize: 13,
          fontWeight: 'bold'
        },
        showBackground: true,
        backgroundStyle: { color: 'rgba(216,178,106,0.08)', borderRadius: [0, 8, 8, 0] },
        animationDuration: 800,
        animationEasing: 'cubicOut'
      }]
    })
  } catch (e) {
    console.error(e)
  }
}

const handleResize = () => {
  handleGraphResize()
  impactChart?.resize()
}

onMounted(async () => {
  // 尝试加载 JSON 数据 - 遍历候选朝代ID
  if (eventId >= 200000) {
    const candidates = getCandidateDynastyIds(eventId)
    for (const dId of candidates) {
      const data = await loadDynastyData(dId)
      if (data && data.events.some(e => e.id === eventId)) {
        jsonData.value = data
        break
      }
    }
  }

  setTimeout(() => {
    isLoaded.value = true
  }, 50)
  nextTick(() => {
    setTimeout(() => {
      handleGraphResize()
      initImpactChart()
    }, 200)
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  impactChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

watch(() => route.params.id, () => {
  nextTick(() => {
    setTimeout(() => {
      handleGraphResize()
      initImpactChart()
    }, 200)
  })
})

// Watch for impacts data changes to reinitialize chart
watch(impacts, () => {
  if (impactChartRef.value && impacts.value.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        handleGraphResize()
        initImpactChart()
      }, 100)
    })
  }
}, { deep: true })
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative" v-if="hasData">
    <nav class="sticky top-0 z-50 backdrop-blur-md bg-[#F8F6F2]/85 border-b border-[#D8B26A]/20">
      <div class="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
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
            <span class="hover:text-[#355C5A] cursor-pointer" @click="router.push('/timeline')">中国历史</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="hover:text-[#355C5A] cursor-pointer" @click="navigateToDynasty">{{ event!.dynasty }}</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="hover:text-[#355C5A] cursor-pointer" @click="navigateToDynastyEvents">重大历史事件</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="text-[#2C2C2C] font-medium">{{ event!.name }}</span>
          </div>
        </div>
      </div>
    </nav>

    <section class="relative px-8 py-12 overflow-hidden">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-12 gap-8 items-center" style="min-height: 440px;">
          <!-- Left: Content -->
          <div class="col-span-7">
            <div class="flex items-center gap-3 mb-5">
              <span class="px-3 py-1 text-xs bg-[#C34739]/10 text-[#C34739] border border-[#C34739]/20 rounded-full font-medium">{{ event!.event_type }}</span>
              <span class="px-3 py-1 text-xs bg-[#355C5A]/8 text-[#355C5A] border border-[#355C5A]/20 rounded-full cursor-pointer hover:bg-[#355C5A]/15" @click="navigateToDynasty">{{ event!.dynasty }}</span>
              <span v-if="event!.location" class="px-3 py-1 text-xs bg-[#D8B26A]/10 text-[#8B5A2B] border border-[#D8B26A]/20 rounded-full">{{ event!.location }}</span>
            </div>

            <h1 class="font-calligraphy text-6xl md:text-7xl text-[#2C2C2C] tracking-wider mb-4">{{ event!.name }}</h1>

            <div class="flex items-center gap-3 text-[#4A4A3A] mb-5">
              <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span class="text-base">{{ duration }}</span>
              <span v-if="event!.location" class="w-1 h-1 rounded-full bg-[#D8B26A]/50"></span>
              <svg v-if="event!.location" class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              <span v-if="event!.location" class="text-base">{{ event!.location }}</span>
            </div>

            <p class="text-lg text-[#2C2C2C]/90 leading-relaxed max-w-2xl mb-4 font-serif">{{ event!.summary }}</p>
            <p v-if="event!.one_sentence" class="text-base text-[#8B5A2B] leading-relaxed max-w-2xl font-serif italic border-l-4 border-[#D8B26A] pl-4">
              {{ event!.one_sentence }}
            </p>
            <p v-else-if="event!.significance" class="text-base text-[#8B5A2B] leading-relaxed max-w-2xl font-serif italic border-l-4 border-[#D8B26A] pl-4">
              {{ event!.significance }}
            </p>
          </div>

          <!-- Right: Image -->
          <div class="col-span-5">
            <div class="relative rounded-xl overflow-hidden border border-[#D8B26A]/20">
              <img
                v-if="event!.image_url"
                :src="event!.image_url"
                :alt="event!.name"
                class="w-full h-[440px] object-cover object-top"
                @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/event' + event!.id + '/600/440'; e.target.onerror = null }"
              />
              <div v-else class="w-full h-[440px] bg-gradient-to-br from-[#D8B26A]/25 to-[#355C5A]/20 flex items-center justify-center">
                <span class="font-calligraphy text-6xl text-[#2C2C2C]/30">{{ event!.name.charAt(0) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-12 gap-10">
          <div class="col-span-7">
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-8 flex items-center gap-3">
              <span class="w-1 h-7 bg-[#C34739] rounded-full"></span>
              事件经过
            </h2>
            <div class="space-y-4">
              <div
                v-for="(n, idx) in narratives"
                :key="idx"
                class="group flex gap-4 p-4 bg-white/50 border border-[#D8B26A]/15 rounded-lg hover:bg-white/80 hover:border-[#D8B26A]/40 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
              >
                <div class="flex flex-col items-center pt-1.5">
                  <div class="w-3 h-3 rounded-full bg-[#C34739] group-hover:scale-125 transition-transform ring-4 ring-[#C34739]/10"></div>
                  <div v-if="idx < narratives.length - 1" class="w-px flex-1 bg-[#D8B26A]/30 mt-1"></div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-1">
                    <span class="text-sm text-[#C34739] font-medium">{{ formattedYear(n.year!) }}</span>
                    <span v-if="n.tag" class="px-2 py-0.5 text-xs bg-[#355C5A]/10 text-[#355C5A] rounded">{{ n.tag }}</span>
                  </div>
                  <div class="text-base text-[#2C2C2C] font-medium group-hover:text-[#C34739] transition-colors mb-1">{{ n.title }}</div>
                  <p class="text-sm text-[#4A4A3A]/70 leading-relaxed">{{ n.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-5">
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-8 flex items-center gap-3">
              <span class="w-1 h-7 bg-[#355C5A] rounded-full"></span>
              事件背景
            </h2>
            <div class="bg-white/50 border border-[#D8B26A]/15 rounded-lg p-6 space-y-5">
              <div v-if="background.political" class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-[#C34739]/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-[#C34739]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21h18M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"></path></svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm text-[#355C5A] font-medium mb-1">政治背景</div>
                  <p class="text-sm text-[#4A4A3A]/80 leading-relaxed">{{ background.political }}</p>
                </div>
              </div>
              <div v-if="background.economic" class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-[#D8B26A]/15 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-[#8B5A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm text-[#8B5A2B] font-medium mb-1">经济背景</div>
                  <p class="text-sm text-[#4A4A3A]/80 leading-relaxed">{{ background.economic }}</p>
                </div>
              </div>
              <div v-if="background.social" class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-[#355C5A]/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-[#355C5A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm text-[#355C5A] font-medium mb-1">社会背景</div>
                  <p class="text-sm text-[#4A4A3A]/80 leading-relaxed">{{ background.social }}</p>
                </div>
              </div>
              <div v-if="background.cultural" class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-[#5C7A5E]/15 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-[#5C7A5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm text-[#5C7A5E] font-medium mb-1">文化背景</div>
                  <p class="text-sm text-[#4A4A3A]/80 leading-relaxed">{{ background.cultural }}</p>
                </div>
              </div>
              <div v-if="background.geographic" class="flex gap-3">
                <div class="w-8 h-8 rounded-full bg-[#D8B26A]/15 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-[#8B5A2B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                </div>
                <div class="flex-1">
                  <div class="text-sm text-[#8B5A2B] font-medium mb-1">地理背景</div>
                  <p class="text-sm text-[#4A4A3A]/80 leading-relaxed">{{ background.geographic }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14 bg-[#F5F2EC]/40">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-calligraphy text-2xl text-[#2C2C2C] flex items-center gap-3">
            <span class="w-1 h-7 bg-[#8B5A2B] rounded-full"></span>
            关键人物
          </h2>
          <span class="text-sm text-[#4A4A3A]/60">点击人物头像可跳转至人物详情页</span>
        </div>

        <div class="grid grid-cols-4 gap-6">
          <div class="bg-white/60 border border-[#D8B26A]/15 rounded-lg p-5">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-1.5 h-1.5 rounded-full bg-[#C34739]"></span>
              <h3 class="text-sm text-[#C34739] font-medium">领导者</h3>
              <span class="text-xs text-[#4A4A3A]/50">({{ leaders.length }})</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="p in leaders"
                :key="p.name"
                class="flex items-center gap-3 cursor-pointer group"
                @click="navigateToPerson(p.name)"
              >
                <div class="w-12 h-12 rounded-full bg-[#C34739]/10 border border-[#C34739]/20 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-[#C34739]/40 transition-all relative">
                  <span class="absolute inset-0 flex items-center justify-center font-calligraphy text-xl text-[#C34739]">{{ p.name.charAt(0) }}</span>
                  <img v-if="hasPersonImage(p.name)" :src="getPersonByName(p.name)?.image_url" :alt="p.name" class="w-full h-full object-cover relative z-10" @error="(e: Event) => onPersonImageError(e, p.name)" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-[#2C2C2C] font-medium group-hover:text-[#C34739] transition-colors truncate">{{ p.name }}</div>
                  <div class="text-xs text-[#4A4A3A]/60 truncate">{{ p.role }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white/60 border border-[#D8B26A]/15 rounded-lg p-5">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-1.5 h-1.5 rounded-full bg-[#355C5A]"></span>
              <h3 class="text-sm text-[#355C5A] font-medium">参与者</h3>
              <span class="text-xs text-[#4A4A3A]/50">({{ participants.length }})</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="p in participants"
                :key="p.name"
                class="flex items-center gap-3 cursor-pointer group"
                @click="navigateToPerson(p.name)"
              >
                <div class="w-12 h-12 rounded-full bg-[#355C5A]/10 border border-[#355C5A]/20 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-[#355C5A]/40 transition-all relative">
                  <span class="absolute inset-0 flex items-center justify-center font-calligraphy text-xl text-[#355C5A]">{{ p.name.charAt(0) }}</span>
                  <img v-if="hasPersonImage(p.name)" :src="getPersonByName(p.name)?.image_url" :alt="p.name" class="w-full h-full object-cover relative z-10" @error="(e: Event) => onPersonImageError(e, p.name)" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-[#2C2C2C] font-medium group-hover:text-[#355C5A] transition-colors truncate">{{ p.name }}</div>
                  <div class="text-xs text-[#4A4A3A]/60 truncate">{{ p.role }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white/60 border border-[#D8B26A]/15 rounded-lg p-5">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-1.5 h-1.5 rounded-full bg-[#8B5A2B]"></span>
              <h3 class="text-sm text-[#8B5A2B] font-medium">对手 / 对抗方</h3>
              <span class="text-xs text-[#4A4A3A]/50">({{ opponents.length }})</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="p in opponents"
                :key="p.name"
                class="flex items-center gap-3 cursor-pointer group"
                @click="navigateToPerson(p.name)"
              >
                <div class="w-12 h-12 rounded-full bg-[#8B5A2B]/10 border border-[#8B5A2B]/20 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-[#8B5A2B]/40 transition-all relative">
                  <span class="absolute inset-0 flex items-center justify-center font-calligraphy text-xl text-[#8B5A2B]">{{ p.name.charAt(0) }}</span>
                  <img v-if="hasPersonImage(p.name)" :src="getPersonByName(p.name)?.image_url" :alt="p.name" class="w-full h-full object-cover relative z-10" @error="(e: Event) => onPersonImageError(e, p.name)" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-[#2C2C2C] font-medium group-hover:text-[#8B5A2B] transition-colors truncate">{{ p.name }}</div>
                  <div class="text-xs text-[#4A4A3A]/60 truncate">{{ p.role }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white/60 border border-[#D8B26A]/15 rounded-lg p-5">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-1.5 h-1.5 rounded-full bg-[#5C7A5E]"></span>
              <h3 class="text-sm text-[#5C7A5E] font-medium">受影响人物</h3>
              <span class="text-xs text-[#4A4A3A]/50">({{ affected.length }})</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="p in affected"
                :key="p.name"
                class="flex items-center gap-3 cursor-pointer group"
                @click="navigateToPerson(p.name)"
              >
                <div class="w-12 h-12 rounded-full bg-[#5C7A5E]/10 border border-[#5C7A5E]/20 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-[#5C7A5E]/40 transition-all relative">
                  <span class="absolute inset-0 flex items-center justify-center font-calligraphy text-xl text-[#5C7A5E]">{{ p.name.charAt(0) }}</span>
                  <img v-if="hasPersonImage(p.name)" :src="getPersonByName(p.name)?.image_url" :alt="p.name" class="w-full h-full object-cover relative z-10" @error="(e: Event) => onPersonImageError(e, p.name)" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-[#2C2C2C] font-medium group-hover:text-[#5C7A5E] transition-colors truncate">{{ p.name }}</div>
                  <div class="text-xs text-[#4A4A3A]/60 truncate">{{ p.role }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-12 gap-10">
          <div class="col-span-7">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-calligraphy text-2xl text-[#2C2C2C] flex items-center gap-3">
                <span class="w-1 h-7 bg-[#355C5A] rounded-full"></span>
                事件关系图谱
              </h2>
            </div>

            <!-- SVG Narrative Graph -->
            <div
              ref="relationGraphRef"
              class="w-full bg-white/50 rounded-lg border border-[#D8B26A]/20 overflow-hidden relative"
              :style="{ height: relationGraphHeight + 'px' }"
            >
              <!-- Grid background -->
              <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]">
                <defs>
                  <pattern id="eventGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2C2C2C" stroke-width="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#eventGrid)"/>
              </svg>

              <svg
                v-if="eventGraphNodes.length > 0"
                :width="relationGraphWidth"
                :height="relationGraphHeight"
                :viewBox="`0 0 ${relationGraphWidth} ${relationGraphHeight}`"
                class="w-full relative z-10"
                style="display: block;"
              >
                <defs>
                  <marker id="eventArrow" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
                    <polygon points="0 0, 7 2.5, 0 5" fill="#4A4A3A" opacity="0.4"/>
                  </marker>
                  <filter id="eventNodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2C2C2C" flood-opacity="0.08"/>
                  </filter>
                </defs>

                <!-- Edges (lines only) -->
                <g v-for="(edge, ei) in eventGraphEdges" :key="'e' + ei">
                  <path
                    :d="getEdgePath(edge.source, edge.target)"
                    fill="none"
                    :stroke="edge.color"
                    :stroke-opacity="edge.isPersonRelation ? 0.65 : 0.5"
                    :stroke-width="edge.isPersonRelation ? 2 : 1.4"
                    :stroke-dasharray="edge.isPersonRelation ? '5,3' : 'none'"
                    marker-end="url(#eventArrow)"
                  />
                </g>

                <!-- Nodes -->
                <g
                  v-for="node in eventGraphNodes"
                  :key="node.id"
                  :class="node.type !== 'center' ? 'cursor-pointer' : ''"
                  @click="node.type === 'person' ? navigateToPerson(node.name) : (node.type === 'event' && node.eventId ? navigateToEvent(node.eventId) : null)"
                  filter="url(#eventNodeShadow)"
                >
                  <rect
                    :x="node.x" :y="node.y"
                    :width="node.w" :height="node.h"
                    :rx="node.type === 'center' ? 10 : 7"
                    :fill="nodeColorMap[node.type]?.bg"
                    :stroke="nodeColorMap[node.type]?.border"
                    :stroke-width="node.type === 'center' ? 2 : 1.5"
                  />
                  <!-- Inner highlight -->
                  <rect
                    :x="node.x + 2" :y="node.y + 2"
                    :width="node.w - 4" :height="node.h / 2 - 2"
                    :rx="node.type === 'center' ? 8 : 5"
                    fill="white"
                    fill-opacity="0.25"
                  />
                  <text
                    :x="node.x + node.w / 2"
                    :y="node.y + node.h / 2 + 1"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :fill="nodeColorMap[node.type]?.text"
                    :font-size="node.type === 'center' ? '16' : '13'"
                    :font-weight="node.type === 'center' ? 'bold' : 'normal'"
                    :font-family="node.type === 'center' ? 'Ma Shan Zheng, KaiTi, serif' : 'Noto Serif SC, serif'"
                    :letter-spacing="node.type === 'center' ? '2' : '0.5'"
                  >{{ node.name.length > 6 ? node.name.slice(0, 5) + '…' : node.name }}</text>
                </g>

                <!-- Edge Labels -->
                <g v-for="(edge, ei) in eventGraphEdges" :key="'el' + ei">
                  <g v-if="edge.label">
                    <rect
                      :x="(edgeLabelPositions.get('el'+ei) || {x:0,y:0}).x - 24"
                      :y="(edgeLabelPositions.get('el'+ei) || {x:0,y:0}).y - 9"
                      width="48"
                      height="18"
                      rx="9"
                      fill="white"
                      fill-opacity="0.96"
                      :stroke="edge.isPersonRelation ? edge.color : '#D8B26A'"
                      stroke-opacity="0.4"
                      stroke-width="0.8"
                    />
                    <text
                      :x="(edgeLabelPositions.get('el'+ei) || {x:0,y:0}).x"
                      :y="(edgeLabelPositions.get('el'+ei) || {x:0,y:0}).y"
                      text-anchor="middle"
                      dominant-baseline="central"
                      :fill="edge.isPersonRelation ? edge.color : '#4A4A3A'"
                      fill-opacity="0.92"
                      font-size="10"
                      font-weight="600"
                      font-family="Noto Serif SC, serif"
                    >{{ edge.label }}</text>
                  </g>
                </g>
              </svg>

              <!-- Empty state -->
              <div v-if="eventGraphNodes.length === 0" class="flex items-center justify-center py-20 text-[#4A4A3A]/35 text-sm">
                <div class="text-center">
                  <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  暂无关系数据
                </div>
              </div>
            </div>

            <!-- Legend -->
            <div class="flex items-center gap-4 text-xs text-[#4A4A3A]/60 mt-3 justify-center">
              <span class="flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 rounded-sm" style="background:#C34739;"></span>中心事件</span>
              <span class="flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 rounded-sm border" style="border-color:#C34739;background:#FDFBF7;"></span>人物</span>
              <span class="flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 rounded-sm border" style="border-color:#355C5A;background:#F8F6F2;"></span>关联事件</span>
            </div>
            <p class="text-xs text-[#4A4A3A]/35 text-center mt-2" v-if="eventGraphNodes.length > 0">
              点击人物或关联事件节点可跳转至对应详情页
            </p>
          </div>

          <div class="col-span-5 flex flex-col">
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-4 flex items-center gap-3">
              <span class="w-1 h-7 bg-[#C34739] rounded-full"></span>
              历史影响
            </h2>
            <div class="bg-white/50 border border-[#D8B26A]/15 rounded-lg p-6 flex flex-col" :style="{ height: relationGraphHeight + 'px' }">
              <div ref="impactChartRef" class="w-full flex-1" style="min-height: 220px;"></div>
              <p class="text-sm text-[#4A4A3A]/70 leading-relaxed mt-4 pt-3 border-t border-[#D8B26A]/15 font-serif">
                {{ getImpactSummary() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14 bg-[#F5F2EC]/40">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-calligraphy text-2xl text-[#2C2C2C] flex items-center gap-3">
            <span class="w-1 h-7 bg-[#D8B26A] rounded-full"></span>
            历史脉络
          </h2>
          <div class="text-xs text-[#4A4A3A]/50">宏观历史定位 · 点击圆圈跳转</div>
        </div>
        <div class="bg-white/50 border border-[#D8B26A]/15 rounded-lg p-10 overflow-hidden">
          <div class="relative">
            <div class="evolution-line"></div>
            <div class="evolution-nodes" v-if="timeline">
              <div
                v-for="(entry, idx) in timeline"
                :key="idx"
                class="evolution-node"
                :class="{ 'is-current': entry.isCurrent, 'is-cause': idx < timeline.findIndex(e => e.isCurrent), 'is-consequence': idx > timeline.findIndex(e => e.isCurrent) }"
              >
                <div v-if="idx > 0" class="evolution-arrow"></div>
                <div
                  class="evolution-node-inner"
                  :class="{ 'clickable': entry.event_id }"
                  @click="entry.event_id && navigateToChainEvent(entry.title)"
                >
                  <div class="evolution-node-icon">{{ entry.title.charAt(0) }}</div>
                  <div v-if="entry.event_id" class="evolution-node-tooltip">点击跳转 →</div>
                </div>
                <div class="evolution-node-label">
                  <div class="label-title">{{ entry.title }}</div>
                  <div class="label-year">{{ entry.year }}</div>
                </div>
              </div>
            </div>
            <div v-else class="evolution-nodes" v-if="chain.length">
              <div
                v-for="(c, idx) in chain"
                :key="idx"
                class="evolution-node"
                :class="{ 'is-current': c.type === 'event', 'is-cause': c.type === 'cause', 'is-consequence': c.type === 'consequence' || c.type === 'later' }"
              >
                <div v-if="idx > 0" class="evolution-arrow"></div>
                <div
                  class="evolution-node-inner"
                  :class="{ 'clickable': chainEventExists(c.title) && c.type !== 'event' }"
                  :style="{ '--node-color': c.color || '#C34739' }"
                  @click="navigateToChainEvent(c.title)"
                >
                  <div class="evolution-node-icon">{{ c.title.charAt(0) }}</div>
                  <div v-if="chainEventExists(c.title) && c.type !== 'event'" class="evolution-node-tooltip">点击跳转 →</div>
                </div>
                <div class="evolution-node-label">
                  <div class="label-title">{{ c.title }}</div>
                  <div class="label-year">{{ c.year }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <section class="px-8 py-14">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between mb-8">
          <h2 class="font-calligraphy text-2xl text-[#2C2C2C] flex items-center gap-3">
            <span class="w-1 h-7 bg-[#4A6F7A] rounded-full"></span>
            继续探索
          </h2>
          <div class="flex items-center gap-2 bg-white/50 rounded-md p-1 border border-[#D8B26A]/20">
            <button
              @click="exploreTab = 'person'"
              class="px-4 py-1.5 text-sm rounded transition-all"
              :class="exploreTab === 'person' ? 'bg-[#355C5A] text-white' : 'text-[#4A4A3A] hover:text-[#355C5A]'"
            >推荐人物</button>
            <button
              @click="exploreTab = 'event'"
              class="px-4 py-1.5 text-sm rounded transition-all"
              :class="exploreTab === 'event' ? 'bg-[#355C5A] text-white' : 'text-[#4A4A3A] hover:text-[#355C5A]'"
            >推荐事件</button>
          </div>
        </div>

        <div v-if="exploreTab === 'person' && validRelatedPersons.length > 0" class="grid grid-cols-6 gap-4" style="min-height: 340px;">
          <div
            v-for="name in validRelatedPersons"
            :key="name"
            @click="navigateToPerson(name)"
            class="group cursor-pointer"
          >
            <div class="aspect-[3/4] rounded-md overflow-hidden border border-[#D8B26A]/15 mb-2 relative bg-gradient-to-br from-[#D8B26A]/20 to-[#355C5A]/15">
              <span class="absolute inset-0 flex items-center justify-center font-calligraphy text-5xl text-[#2C2C2C]/25">{{ name.charAt(0) }}</span>
              <img
                v-if="hasPersonImage(name)"
                :src="getPersonByName(name)?.image_url"
                :alt="name"
                class="w-full h-full object-cover relative z-10 group-hover:scale-105 transition-all duration-500"
                @error="(e: Event) => onPersonImageError(e, name)"
              />
            </div>
            <div class="text-center">
              <div class="text-sm text-[#2C2C2C] font-medium group-hover:text-[#355C5A] transition-colors">{{ name }}</div>
              <div class="text-xs text-[#4A4A3A]/50">{{ getPersonByName(name)?.dynasty }} · {{ getPersonByName(name)?.category }}</div>
            </div>
          </div>
        </div>

        <div v-else-if="exploreTab === 'event'" class="grid grid-cols-4 gap-5" style="min-height: 340px;">
          <div
            v-for="ev in relatedEventsData"
            :key="ev.id"
            @click="navigateToEvent(ev.id)"
            class="group cursor-pointer bg-white/60 border border-[#D8B26A]/20 rounded-md overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >
            <div class="aspect-video overflow-hidden relative bg-gradient-to-br from-[#355C5A]/20 via-[#D8B26A]/15 to-[#C34739]/20 flex-shrink-0">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-10 h-10 text-[#355C5A]/40 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <div class="text-[#4A4A3A]/60 text-xs">{{ ev.name }}</div>
                </div>
              </div>
              <img
                v-if="ev.image_url"
                :src="ev.image_url"
                :alt="ev.name"
                class="w-full h-full object-cover relative z-10 group-hover:scale-105 transition-all duration-500"
                @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/event' + ev.id + '/400/300'; e.target.onerror = null }"
              />
            </div>
            <div class="p-4 flex-1">
              <div class="flex items-center justify-between mb-1">
                <h3 class="text-base font-medium text-[#2C2C2C] group-hover:text-[#C34739] transition-colors">{{ ev.name }}</h3>
                <span class="text-xs text-[#4A4A3A]/50">{{ formattedYear(ev.start_year) }}</span>
              </div>
              <p class="text-sm text-[#4A4A3A]/70 line-clamp-2">{{ ev.summary }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="py-8 text-center border-t border-[#D8B26A]/15">
      <div class="font-calligraphy text-2xl text-[#4A4A3A]/40 mb-2">千年一脉</div>
      <p class="text-xs text-[#4A4A3A]/40">历史不会停留在书页，它也存在于每一个家庭</p>
    </footer>
  </div>

  <ComingSoon v-else title="数据整理中" description="该事件数据正在整理中，敬请期待。" />
</template>

<style scoped>
.evolution-line {
  position: absolute;
  top: 28px;
  left: 30px;
  right: 30px;
  height: 1px;
  background: linear-gradient(90deg,
    rgba(74, 74, 74, 0.3) 0%,
    rgba(195, 71, 57, 0.5) 30%,
    rgba(195, 71, 57, 0.6) 50%,
    rgba(92, 122, 94, 0.5) 70%,
    rgba(216, 178, 106, 0.4) 100%
  );
  z-index: 0;
}

.evolution-nodes {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  z-index: 1;
  gap: 16px;
}

.evolution-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
  position: relative;
}

.evolution-node-inner {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #D8B26A;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(216, 178, 106, 0.3);
  z-index: 2;
}

.evolution-node.is-current .evolution-node-inner {
  width: 72px;
  height: 72px;
  background: #C34739;
  border-color: rgba(216, 178, 106, 0.8);
  box-shadow: 0 6px 20px rgba(195, 71, 57, 0.45), 0 0 0 6px rgba(195, 71, 57, 0.12);
  animation: pulse-current 2.8s ease-in-out infinite;
}

.evolution-node.is-cause .evolution-node-inner {
  background: #4A4A3A;
  box-shadow: 0 4px 12px rgba(74, 74, 74, 0.3);
}

.evolution-node.is-consequence .evolution-node-inner {
  background: #355C5A;
  box-shadow: 0 4px 12px rgba(53, 92, 90, 0.3);
}

.evolution-node-icon {
  font-family: 'Ma Shan Zheng', 'KaiTi', serif;
  font-size: 22px;
  color: #fff;
  font-weight: 600;
  line-height: 1;
}

.evolution-node.is-current .evolution-node-icon {
  font-size: 28px;
}

.evolution-node-inner:hover {
  transform: scale(1.08);
}

.evolution-node-inner.clickable:hover {
  transform: scale(1.14);
  box-shadow: 0 8px 24px rgba(195, 71, 57, 0.4);
  cursor: pointer;
  z-index: 100;
}

.evolution-node-tooltip {
  position: absolute;
  top: 50%;
  left: calc(100% + 12px);
  transform: translateY(-50%) translateX(4px);
  background: rgba(255, 255, 255, 0.97);
  color: #4A4A3A;
  border: 1px solid #D8B26A;
  border-radius: 6px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'KaiTi', serif;
  box-shadow: 0 4px 16px rgba(139, 90, 43, 0.15);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 999;
  pointer-events: none;
  white-space: nowrap;
}

.evolution-node-inner.clickable:hover .evolution-node-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(-50%) translateX(0);
}

.evolution-node-tooltip::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -8px;
  transform: translateY(-50%);
  border: 7px solid transparent;
  border-right-color: #D8B26A;
  border-left: 0;
}

.evolution-node-tooltip::after {
  content: '';
  position: absolute;
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: rgba(255, 255, 255, 0.97);
  border-left: 0;
}

.evolution-node-label {
  margin-top: 16px;
  text-align: center;
  max-width: 120px;
}

.label-title {
  font-size: 13px;
  font-weight: 500;
  color: #2C2C2C;
  line-height: 1.3;
  margin-bottom: 4px;
}

.evolution-node.is-current .label-title {
  color: #C34739;
  font-weight: 600;
}

.label-year {
  font-size: 11px;
  color: #4A4A3A;
  opacity: 0.7;
}

.evolution-arrow {
  position: absolute;
  top: 28px;
  left: -50%;
  width: 100%;
  height: 0;
  z-index: 1;
}

.evolution-arrow::before {
  content: '';
  position: absolute;
  top: -4px;
  right: -2px;
  width: 0;
  height: 0;
  border-left: 8px solid rgba(216, 178, 106, 0.6);
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}

.evolution-arrow::after {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(216, 178, 106, 0.5));
}

@keyframes pulse-current {
  0%, 100% {
    box-shadow: 0 6px 20px rgba(195, 71, 57, 0.45), 0 0 0 6px rgba(195, 71, 57, 0.12);
  }
  50% {
    box-shadow: 0 6px 24px rgba(195, 71, 57, 0.55), 0 0 0 10px rgba(195, 71, 57, 0.08);
  }
}

@media (max-width: 768px) {
  .evolution-nodes {
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }
  .evolution-line {
    top: 30px;
    left: 50%;
    right: auto;
    width: 1px;
    height: calc(100% - 60px);
    background: linear-gradient(180deg,
      rgba(74, 74, 74, 0.3) 0%,
      rgba(195, 71, 57, 0.5) 30%,
      rgba(195, 71, 57, 0.6) 50%,
      rgba(92, 122, 94, 0.5) 70%,
      rgba(216, 178, 106, 0.4) 100%
    );
  }
  .evolution-node-label {
    margin-top: 8px;
  }
  .evolution-arrow {
    display: none;
  }
}
</style>
