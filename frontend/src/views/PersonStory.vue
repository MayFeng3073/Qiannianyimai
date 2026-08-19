<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { persons, dynasties } from '@/mock/data'
import { loadDynastyData, type DynastyData } from '@/services/dynastyDataService'

const route = useRoute()
const router = useRouter()

// 从人物ID推断朝代ID (201001 -> 201)
const personId = Number(route.params.id) || 1022
const jsonData = ref<DynastyData | null>(null)

// 加载数据 - 尝试可能的朝代ID
async function tryLoadPersonStoryData(id: number): Promise<DynastyData | null> {
  const prefix = Math.floor(id / 1000)
  const candidates = [prefix]
  if (id >= 200000) candidates.push(201)
  for (const dId of [...new Set(candidates)]) {
    const data = await loadDynastyData(dId)
    if (data && data.persons.some(p => p.id === id)) {
      return data
    }
  }
  return null
}

const person = computed(() => {
  if (jsonData.value) {
    const found = jsonData.value.persons.find(p => p.id === personId && p.level === 2)
    if (found) return found
  }
  return persons.find(p => p.id === personId && p.level === 2)
})
const hasData = computed(() => person.value !== undefined)

const storyTitle = computed(() => {
  return person.value?.story?.title || `${person.value?.name}的故事`
})

const storyContent = computed(() => {
  return person.value?.story?.content || ''
})

const hasStorySection = computed(() => {
  if (!person.value) return false
  return !!(person.value.story?.content || person.value.narrative_relations?.nodes?.length)
})

const storyImageUrl = computed(() => {
  return person.value?.story?.image_url || person.value?.image_url || ''
})

const formattedYear = (year: number | null | undefined) => {
  if (!year && year !== 0) return '不详'
  if (year < 0) return `前${Math.abs(year)}年`
  return `${year}年`
}

const lifeSpan = computed(() => {
  if (!person.value) return ''
  const b = formattedYear(person.value.birth_year)
  const d = formattedYear(person.value.death_year)
  return `${b} — ${d}`
})

const personTags = computed(() => {
  if (!person.value) return []
  const tags: string[] = []
  if (person.value.category) tags.push(person.value.category)
  if (person.value.occupations) tags.push(...person.value.occupations.slice(0, 2))
  if (person.value.art_name) tags.push(person.value.art_name)
  return tags.slice(0, 5)
})

const narrativeNodes = computed(() => {
  return person.value?.narrative_relations?.nodes || []
})

const narrativeEdges = computed(() => {
  return person.value?.narrative_relations?.edges || []
})

const goBack = () => {
  navigateToDynastyPersons()
}

const navigateToPerson = (name: string) => {
  const found = jsonData.value
    ? jsonData.value.persons.find(p => p.name === name)
    : persons.find(p => p.name === name)
  if (found) {
    if (found.level === 2) {
      router.push(`/person/${found.id}/story`)
    } else {
      router.push(`/person/${found.id}`)
    }
  }
}

const navigateToDynasty = () => {
  if (!person.value) return
  const d = dynasties.find(dy => dy.name === person.value!.dynasty)
  if (d) router.push(`/dynasty/${d.id}`)
}

const navigateToDynastyPersons = () => {
  if (!person.value) return
  const d = dynasties.find(dy => dy.name === person.value!.dynasty)
  if (d) router.push(`/dynasty/${d.id}/persons`)
}

// ========== Narrative Relation Diagram (Custom SVG) ==========
const diagramContainer = ref<HTMLElement | null>(null)
const diagramWidth = ref(720)
const diagramHeight = ref(480)

const nodeColorMap: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  person: { bg: '#FDFBF7', border: '#C34739', text: '#2C2C2C', shadow: 'rgba(195,71,57,0.12)' },
  event: { bg: '#F8F6F2', border: '#355C5A', text: '#2C2C2C', shadow: 'rgba(53,92,90,0.1)' },
  story: { bg: '#FDFAF5', border: '#D8B26A', text: '#2C2C2C', shadow: 'rgba(216,178,106,0.12)' }
}

const sizeMap: Record<string, { w: number; h: number; fontSize: number; rx: number }> = {
  large: { w: 130, h: 60, fontSize: 18, rx: 10 },
  medium: { w: 108, h: 48, fontSize: 14, rx: 8 },
  small: { w: 88, h: 40, fontSize: 12, rx: 6 }
}

interface NodeLayout {
  id: string
  x: number
  y: number
  w: number
  h: number
  name: string
  type: string
  size: string
}

interface EdgeLayout {
  source: NodeLayout
  target: NodeLayout
  label: string
  direction: string
}

const nodeLayouts = computed<NodeLayout[]>(() => {
  const nodes = narrativeNodes.value
  if (nodes.length === 0) return []

  const mainNode = nodes.find(n => n.size === 'large')
  const otherNodes = nodes.filter(n => n.size !== 'large')

  const layouts: NodeLayout[] = []
  const centerX = diagramWidth.value / 2
  const topY = 60

  const mainSize = sizeMap['large']
  layouts.push({
    id: mainNode?.id || nodes[0].id,
    x: centerX - mainSize.w / 2,
    y: topY,
    w: mainSize.w,
    h: mainSize.h,
    name: mainNode?.name || nodes[0].name,
    type: mainNode?.type || 'person',
    size: 'large'
  })

  const mediumNodes = otherNodes.filter(n => n.size === 'medium' || !n.size)
  const smallNodes = otherNodes.filter(n => n.size === 'small')

  const midY = topY + mainSize.h + 100
  const botY = midY + sizeMap['medium'].h + 90

  const medGap = Math.min(200, (diagramWidth.value - 100) / Math.max(mediumNodes.length, 1))
  const medStartX = centerX - ((mediumNodes.length - 1) * medGap) / 2

  mediumNodes.forEach((node, i) => {
    const sz = sizeMap[node.size || 'medium']
    layouts.push({
      id: node.id,
      x: medStartX + i * medGap - sz.w / 2,
      y: midY,
      w: sz.w,
      h: sz.h,
      name: node.name,
      type: node.type,
      size: node.size || 'medium'
    })
  })

  const smGap = Math.min(180, (diagramWidth.value - 100) / Math.max(smallNodes.length, 1))
  const smStartX = centerX - ((smallNodes.length - 1) * smGap) / 2

  smallNodes.forEach((node, i) => {
    const sz = sizeMap['small']
    layouts.push({
      id: node.id,
      x: smStartX + i * smGap - sz.w / 2,
      y: botY,
      w: sz.w,
      h: sz.h,
      name: node.name,
      type: node.type,
      size: 'small'
    })
  })

  return layouts
})

const edgeLayouts = computed<EdgeLayout[]>(() => {
  const layouts = nodeLayouts.value
  const nodeMap = new Map(layouts.map(n => [n.id, n]))
  const edges = narrativeEdges.value

  return edges.map(e => {
    const src = nodeMap.get(e.source)
    const tgt = nodeMap.get(e.target)
    return {
      source: src!,
      target: tgt!,
      label: e.label,
      direction: e.direction || 'forward'
    }
  }).filter(e => e.source && e.target)
})

function getEdgePath(src: NodeLayout, tgt: NodeLayout): string {
  const srcX = src.x + src.w / 2
  const srcY = src.y + src.h
  const tgtX = tgt.x + tgt.w / 2
  const tgtY = tgt.y

  const dy = tgtY - srcY
  const cpOffset = Math.min(Math.abs(dy) * 0.4, 60)

  return `M ${srcX} ${srcY} C ${srcX} ${srcY + cpOffset}, ${tgtX} ${tgtY - cpOffset}, ${tgtX} ${tgtY}`
}

// 标签位置 + 碰撞检测：沿连线中点，检测与所有节点矩形是否重叠，推离到无碰撞位置
const edgeLabelPositions = computed(() => {
  const positions = new Map<string, { x: number; y: number }>()
  const edges = edgeLayouts.value
  const nodes = nodeLayouts.value

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]
    if (!edge.label) continue

    const src = edge.source
    const tgt = edge.target
    const srcX = src.x + src.w / 2
    const srcY = src.y + src.h
    const tgtX = tgt.x + tgt.w / 2
    const tgtY = tgt.y

    // 初始位置：连线中点
    let x = (srcX + tgtX) / 2
    let y = (srcY + tgtY) / 2

    // 碰撞检测：标签 AABB 与所有节点 AABB
    const labelW = 48, labelH = 18
    const margin = 3

    for (let attempt = 0; attempt < 3; attempt++) {
      let collided = false
      let pushX = 0, pushY = 0
      let minPush = Infinity

      for (const node of nodes) {
        const lx = x - labelW / 2 - margin
        const ly = y - labelH / 2 - margin
        const lx2 = x + labelW / 2 + margin
        const ly2 = y + labelH / 2 + margin
        const nx = node.x, ny = node.y
        const nx2 = node.x + node.w, ny2 = node.y + node.h

        if (lx < nx2 && lx2 > nx && ly < ny2 && ly2 > ny) {
          collided = true
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

    positions.set(`el${i}`, { x, y })
  }
  return positions
})

const handleResize = () => {
  if (diagramContainer.value) {
    const rect = diagramContainer.value.getBoundingClientRect()
    diagramWidth.value = Math.max(400, rect.width - 48)
    diagramHeight.value = Math.max(360, nodeLayouts.value.length > 0
      ? (nodeLayouts.value[nodeLayouts.value.length - 1]?.y || 0) + 90
      : 480)
  }
}

onMounted(async () => {
  // 尝试加载 JSON 数据
  if (personId >= 200000) {
    const data = await tryLoadPersonStoryData(personId)
    if (data) {
      jsonData.value = data
    }
  }

  nextTick(() => {
    handleResize()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative" v-if="hasData">
    <!-- Background texture -->
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

    <!-- ====== Navigation Bar (same as Person.vue) ====== -->
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
            <span class="hover:text-[#355C5A] cursor-pointer" @click="navigateToDynasty">{{ person!.dynasty }}</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="hover:text-[#355C5A] cursor-pointer" @click="navigateToDynastyPersons">代表人物</span>
            <span class="mx-1.5 text-[#D8B26A]/40">›</span>
            <span class="text-[#2C2C2C] font-medium">{{ person!.name }}</span>
          </div>
        </div>
        
      </div>
    </nav>

    <!-- 返回按钮 -->
    <div class="max-w-7xl mx-auto px-8 pt-2 bg-transparent">
      <button
        @click="goBack"
        class="flex items-center gap-2 text-base text-white/90 hover:text-white transition-colors group drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
      >
        <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span class="font-medium">返回</span>
      </button>
    </div>

    <!-- ====== Section 1: Hero (same grid as Person.vue) ====== -->
    <section class="relative py-16 px-8" style="min-height: 580px;">
      <div class="absolute top-0 left-1/3 w-[500px] h-[180px] bg-gradient-to-b from-[#D8B26A]/12 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-0 w-72 h-72 bg-[#355C5A]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-10 left-10 w-56 h-56 bg-[#C34739]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-6xl mx-auto relative z-10">
        <div class="grid grid-cols-12 gap-10 items-center">
          <!-- Person Image -->
          <div class="col-span-5">
            <div class="w-full aspect-[3/4] rounded-md overflow-hidden shadow-xl border border-[#D8B26A]/20 relative">
              <div class="absolute inset-0 bg-gradient-to-br from-[#D8B26A]/25 to-[#355C5A]/20 flex items-center justify-center">
                <span class="font-calligraphy text-8xl text-[#2C2C2C]/30">{{ person!.name.charAt(0) }}</span>
              </div>
              <img
                :src="person!.image_url"
                :alt="person!.name"
                class="w-full h-full object-cover absolute inset-0 z-10 opacity-0 transition-opacity duration-500"
                onload="this.style.opacity='1'"
                @error="(e: any) => { e.target.src = 'https://picsum.photos/seed/person' + person!.id + '/400/500'; e.target.onerror = null }"
              />
            </div>
          </div>

          <!-- Person Info -->
          <div class="col-span-7">
            <div class="flex items-baseline gap-4 mb-4">
              <h1 class="font-calligraphy text-6xl md:text-7xl text-[#2C2C2C] tracking-wider">{{ person!.name }}</h1>
              <span class="text-xl text-[#4A4A3A] font-light" v-if="person!.courtesy_name">字 {{ person!.courtesy_name }}</span>
            </div>

            <div class="flex items-center gap-4 text-base text-[#4A4A3A] mb-4">
              <span>{{ person!.dynasty }}</span>
              <span class="w-1 h-1 rounded-full bg-[#D8B26A]/50"></span>
              <span>{{ person!.occupations?.[0] || '历史人物' }}</span>
              <span class="w-1 h-1 rounded-full bg-[#D8B26A]/50"></span>
              <span>{{ person!.category }}</span>
            </div>

            <!-- Italic quoted summary -->
            <div class="text-xl text-[#2C2C2C] font-serif mb-4 italic">
              <span class="text-[#C34739] text-2xl font-serif">&ldquo;</span>
              {{ person!.summary }}
              <span class="text-[#C34739] text-2xl font-serif">&rdquo;</span>
            </div>

            <!-- Birth year & Birthplace -->
            <div class="flex items-center gap-4 text-sm text-[#4A4A3A]/60 mb-5">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{{ lifeSpan }}</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#D8B26A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                </svg>
                <span>{{ person!.birth_place || '不详' }}</span>
              </div>
            </div>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in personTags"
                :key="tag"
                class="px-4 py-1.5 text-sm bg-white/60 border border-[#D8B26A]/30 text-[#4A4A3A] rounded-full hover:border-[#D8B26A]/60 hover:text-[#C34739] transition-all cursor-default"
              >{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <template v-if="hasStorySection">
    <!-- Section Divider -->
    <div class="w-full h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-transparent"></div>

    <!-- ====== Section 2: Story + Relationship (Improved Aesthetics) ====== -->
    <section class="relative px-8 py-14">
      <!-- Decorative background blobs -->
      <div class="absolute top-0 right-0 w-80 h-80 bg-[#D8B26A]/4 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-[#355C5A]/3 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-6xl mx-auto relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Left: Relationship Diagram -->
          <div>
            <!-- Section Header -->
            <div class="mb-6">
              <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-2 flex items-center gap-3">
                <span class="w-1.5 h-7 bg-[#355C5A] rounded-full"></span>
                因缘际会
              </h2>
            </div>

            <!-- Legend -->
            <div class="flex items-center gap-5 mb-5 ml-5">
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-sm border" style="border-color: #C34739; background: #FDFBF7;"></span>
                <span class="text-xs text-[#4A4A3A]/55">人物</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-sm border" style="border-color: #355C5A; background: #F8F6F2;"></span>
                <span class="text-xs text-[#4A4A3A]/55">事件</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-sm border" style="border-color: #D8B26A; background: #FDFAF5;"></span>
                <span class="text-xs text-[#4A4A3A]/55">故事</span>
              </div>
            </div>

            <!-- Diagram Container -->
            <div
              ref="diagramContainer"
              class="w-full bg-white/50 rounded-lg border border-[#D8B26A]/20 shadow-sm overflow-hidden relative"
              :style="{ minHeight: diagramHeight + 'px' }"
            >
              <!-- Subtle grid background -->
              <svg class="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2C2C2C" stroke-width="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)"/>
              </svg>

              <svg
                v-if="nodeLayouts.length > 0"
                :width="diagramWidth"
                :height="diagramHeight"
                :viewBox="`0 0 ${diagramWidth} ${diagramHeight}`"
                class="w-full relative z-10"
                style="display: block;"
              >
                <defs>
                  <!-- Arrow marker -->
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="8"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#4A4A3A" opacity="0.45" />
                  </marker>
                  <!-- Drop shadow filter -->
                  <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2C2C2C" flood-opacity="0.08"/>
                  </filter>
                </defs>

                <!-- Edges -->
                <g v-for="(edge, ei) in edgeLayouts" :key="'e' + ei">
                  <path
                    :d="getEdgePath(edge.source, edge.target)"
                    fill="none"
                    stroke="#4A4A3A"
                    stroke-opacity="0.25"
                    stroke-width="1.8"
                    stroke-dasharray="6 3"
                    marker-end="url(#arrowhead)"
                  />
                  <!-- Edge label background -->
                  <rect
                    :x="(edgeLabelPositions.get('el' + ei) || { x: 0 }).x - 24"
                    :y="(edgeLabelPositions.get('el' + ei) || { y: 0 }).y - 15"
                    width="48"
                    height="18"
                    rx="9"
                    fill="white"
                    fill-opacity="0.85"
                    stroke="#D8B26A"
                    stroke-opacity="0.2"
                    stroke-width="0.5"
                  />
                  <text
                    :x="(edgeLabelPositions.get('el' + ei) || { x: 0 }).x"
                    :y="(edgeLabelPositions.get('el' + ei) || { y: 0 }).y - 4"
                    text-anchor="middle"
                    fill="#4A4A3A"
                    fill-opacity="0.7"
                    font-size="11"
                    font-family="Noto Serif SC, serif"
                  >{{ edge.label }}</text>
                </g>

                <!-- Nodes -->
                <g
                  v-for="node in nodeLayouts"
                  :key="node.id"
                  :class="node.type === 'person' ? 'cursor-pointer' : ''"
                  @click="node.type === 'person' && node.name !== person!.name ? navigateToPerson(node.name) : null"
                  filter="url(#nodeShadow)"
                >
                  <rect
                    :x="node.x"
                    :y="node.y"
                    :width="node.w"
                    :height="node.h"
                    :rx="sizeMap[node.size]?.rx || 8"
                    :fill="nodeColorMap[node.type]?.bg || '#F5F2EC'"
                    :stroke="nodeColorMap[node.type]?.border || '#D8B26A'"
                    :stroke-width="node.size === 'large' ? 2 : 1.5"
                  />
                  <!-- Subtle inner highlight -->
                  <rect
                    :x="node.x + 2"
                    :y="node.y + 2"
                    :width="node.w - 4"
                    :height="node.h / 2 - 2"
                    :rx="(sizeMap[node.size]?.rx || 8) - 1"
                    fill="white"
                    fill-opacity="0.3"
                  />
                  <text
                    :x="node.x + node.w / 2"
                    :y="node.y + node.h / 2 + 1"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :fill="nodeColorMap[node.type]?.text || '#2C2C2C'"
                    :font-size="sizeMap[node.size]?.fontSize || 14"
                    :font-weight="node.size === 'large' ? 'bold' : 'normal'"
                    :font-family="node.size === 'large' ? 'Ma Shan Zheng, KaiTi, serif' : 'Noto Serif SC, serif'"
                    :letter-spacing="node.size === 'large' ? '2' : '1'"
                  >{{ node.name }}</text>
                </g>
              </svg>

              <!-- Empty state -->
              <div v-if="nodeLayouts.length === 0" class="flex items-center justify-center py-20 text-[#4A4A3A]/35 text-sm">
                <div class="text-center">
                  <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  暂无关系数据
                </div>
              </div>
            </div>

            <!-- Diagram hint -->
            <p class="text-xs text-[#4A4A3A]/35 text-center mt-3" v-if="nodeLayouts.length > 0">
              点击人物节点可跳转至对应详情页
            </p>
          </div>

          <!-- Right: Story -->
          <div>
            <!-- Story Image -->
            <div class="w-full rounded-lg overflow-hidden border border-[#D8B26A]/20 shadow-lg relative mb-7 group" style="aspect-ratio: 16/7; max-height: 320px;">
              <div class="absolute inset-0 bg-gradient-to-br from-[#355C5A]/15 via-[#D8B26A]/10 to-[#C34739]/12 flex items-center justify-center">
                <span class="font-calligraphy text-4xl text-[#2C2C2C]/15">{{ storyTitle }}</span>
              </div>
              <img
                :src="storyImageUrl"
                :alt="storyTitle"
                class="w-full h-full object-cover absolute inset-0 z-10 opacity-0 transition-all duration-700 group-hover:scale-105"
                onload="this.style.opacity='1'"
                @error="(e: any) => { e.target.src = person!.image_url; e.target.onerror = null }"
              />
              <!-- Image overlay gradient -->
              <div class="absolute inset-0 z-20 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
            </div>

            <!-- Story Title -->
            <h2 class="font-calligraphy text-2xl text-[#2C2C2C] mb-5 flex items-center gap-3">
              <span class="w-1.5 h-7 bg-[#C34739] rounded-full"></span>
              {{ storyTitle }}
            </h2>

            <!-- Story Content -->
            <div class="text-[#4A4A3A] leading-loose text-[15px] space-y-5 font-serif">
              <p class="text-justify indent-8">{{ storyContent }}</p>
            </div>
          </div>
        </div>

        <!-- Full-width decorative footer -->
        <div class="flex items-center gap-4 mt-12">
          <span class="flex-1 h-px bg-gradient-to-r from-transparent via-[#D8B26A]/30 to-[#D8B26A]/10"></span>
          <span class="w-2 h-2 rounded-full bg-[#D8B26A]/30"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-[#C34739]/25"></span>
          <span class="w-2 h-2 rounded-full bg-[#D8B26A]/30"></span>
          <span class="flex-1 h-px bg-gradient-to-l from-transparent via-[#D8B26A]/30 to-[#D8B26A]/10"></span>
        </div>
      </div>
    </section>
    </template>

    <!-- Bottom spacing -->
    <div class="py-10"></div>
  </div>

  <!-- Loading / Not Found -->
  <div v-else class="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
    <div class="text-center">
      <div class="font-calligraphy text-6xl text-[#2C2C2C]/20 mb-4">{{ personId }}</div>
      <p class="text-[#4A4A3A]/50">人物数据加载中，或该人物暂无故事卡片数据。</p>
      <button
        @click="goBack"
        class="mt-6 px-6 py-2 text-sm text-[#4A4A3A] border border-[#D8B26A]/30 rounded-md hover:border-[#D8B26A]/60 hover:text-[#C34739] transition-all"
      >
        返回
      </button>
    </div>
  </div>
</template>

<style scoped>
</style>