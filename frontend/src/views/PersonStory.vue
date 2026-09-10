<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { persons, dynasties, events } from '@/mock/data'
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
const diagramHeight = ref(432)

const nodeColorMap: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  person: { bg: '#FDFBF7', border: '#C34739', text: '#2C2C2C', shadow: 'rgba(195,71,57,0.12)' },
  event: { bg: '#F8F6F2', border: '#355C5A', text: '#2C2C2C', shadow: 'rgba(53,92,90,0.1)' },
  story: { bg: '#FBF8F0', border: '#D8B26A', text: '#2C2C2C', shadow: 'rgba(216,178,106,0.14)' },
  background: { bg: '#EDF2F1', border: '#7FA6A3', text: '#2C2C2C', shadow: 'rgba(127,166,163,0.12)' }
}

// 关系类型 → 配色：不同关系用不同颜色区分
const relColorMap: Record<string, string> = {
  '君臣': '#D8B26A', '敌对': '#C34739', '同盟': '#4A8A9E', '盟友': '#5C7A5E',
  '师生': '#4A6F9E', '继承': '#355C5A', '亲属': '#D4756A', '兄弟': '#C95B4E',
  '对手': '#B0563A', '朋友': '#6B8E6A', '同朝': '#7A6A9E', '影响': '#8A6AAE',
  '交流': '#4A7A8A', '因缘': '#B06A4A', '关联': '#8A6A5E', '参与': '#5A8A7A',
  '卿族': '#A06A5E', '宗族': '#8A5A6E', '大夫': '#6E6A5E', '武将': '#9E5A4A',
  '越臣': '#5C7A9E', '谋臣': '#5C7A9E', '谏臣': '#5C7A9E', '楚臣': '#5C7A9E',
  '秦臣': '#5C7A9E', '先君': '#2E6E6C', '后继': '#2E6E6C', '继君': '#2E6E6C',
  '子嗣': '#C05A4E', '子孙': '#C05A4E', '秦君': '#D8B26A', '晋君': '#D8B26A',
  '鲁君': '#D8B26A', '吴君': '#D8B26A', '辅臣': '#5C7A9E', '秦将': '#9E5A4A',
  '主导': '#C34739', '对抗': '#B0563A', '受影响': '#8A9E6A'
}
const relPalette = ['#5C7A5E', '#C34739', '#D8B26A', '#355C5A', '#7FA6A3', '#B06A4A', '#2E6E6C', '#6B8E6A']
// 关系标签归一化：去掉历史遗留的「·因缘」等叠缀，只保留干净的关系名称（盟友/影响/师生…）
const normLabel = (label: string): string => {
  if (!label) return '关联'
  const base = label.split('·')[0].trim()
  return base || '关联'
}
const relationColor = (label: string): string => {
  const lbl = normLabel(label)
  const c = relColorMap[lbl]
  if (c) return c
  let h = 0
  for (let i = 0; i < lbl.length; i++) h = (h * 31 + lbl.charCodeAt(i)) >>> 0
  return relPalette[h % relPalette.length]
}

const sizeMap: Record<string, { w: number; h: number; fontSize: number; rx: number }> = {
  large: { w: 132, h: 62, fontSize: 18, rx: 10 },
  medium: { w: 96, h: 46, fontSize: 13, rx: 8 },
  small: { w: 86, h: 40, fontSize: 12, rx: 6 }
}
const clampNum = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
/**
 * 节点宽度按文字长度自适应（事件名可能长达 10 字，如「齐桓公即位与管仲改革」），
 * 避免长名溢出节点框；宽度受限时自动微缩字号保证文字完整。
 */
function dynSize(name: string, key: keyof typeof sizeMap, maxW = 176) {
  const base = sizeMap[key]
  const len = Math.max(name.length, 1)
  const need = Math.ceil(len * base.fontSize * 1.0) + 22
  const w = Math.min(Math.max(base.w, need), Math.max(base.w, maxW))
  const fs = Math.max(10, Math.min(base.fontSize, Math.floor(((w - 12) / len) * 1.05)))
  return { w, h: base.h, fontSize: fs, rx: base.rx }
}

interface GNode { id: string; name: string; type: string; size: string; pos?: string }
interface GEdge { source: string; target: string; label: string; direction: string }

interface NodeLayout {
  id: string
  x: number
  y: number
  w: number
  h: number
  name: string
  type: string
  size: string
  fontSize: number
  rx: number
  pos?: string
}

interface EdgeLayout {
  source: NodeLayout
  target: NodeLayout
  label: string
  direction: string
  isDirect: boolean
}

// 归一化节点/边：兼容「节点有 id」与「节点只有 name」两种数据，统一用 id 关联
const gNodes = computed<GNode[]>(() =>
  narrativeNodes.value.map(n => ({
    id: n.id ?? n.name,
    name: n.name,
    type: n.type || 'person',
    size: n.size || 'medium',
    pos: n.pos
  }))
)

const gEdges = computed<GEdge[]>(() => {
  const resolve = (v: string) => {
    const byId = gNodes.value.find(n => n.id === v)
    if (byId) return byId.id
    const byName = gNodes.value.find(n => n.name === v)
    return byName ? byName.id : v
  }
  return narrativeEdges.value
    .map(e => ({
      source: resolve(e.source),
      target: resolve(e.target),
      label: normLabel(e.label),
      direction: e.direction || 'forward'
    }))
    .filter(e => e.source !== e.target)
})

/**
 * 「因缘际会」新布局：基于 pos 字段的确定性放置
 *   center = 核心人物居中（朱砂红实心，最大）
 *   top    = 重要人物（如家族/身份关系），置于核心上方
 *   bottom = 关键事件（因果支线），置于核心下方
 *   left   = 前因/因果（引发核心经历的人或事），置于核心左侧
 *   right  = 结果/故事（核心行动的产出），置于核心右侧
 * 横向矩形布局，节点分布均衡、稳定无随机。
 */
const nodeLayouts = computed<NodeLayout[]>(() => {
  const nodes = gNodes.value
  if (!nodes.length) return []

  const W = diagramWidth.value
  const centerName = person.value?.name || ''
  const center = nodes.find(n => n.pos === 'center')
    || nodes.find(n => n.size === 'large')
    || nodes.find(n => n.name === centerName)
    || nodes[0]

  // 外围关键节点：沿用数据原始顺序（脚本已按重要度排序），只保留 1核心 + 最多5个关键节点，
  // 保证画面克制、不拥挤
  const peripheral = nodes.filter(n => n.id !== center.id).slice(0, 5)
  // 自动四扇区均衡：带 pos 的节点按其 pos；不带 pos 的节点贪心放入「当前最空」的扇区
  // （用固定周序打破平局 → 稳定不随机），从而避免历史上"全部默认进右边"导致挤成一列
  const zones: Record<string, GNode[]> = { top: [], bottom: [], left: [], right: [] }
  const zoneCount = { top: 0, bottom: 0, left: 0, right: 0 }
  const cycle: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'right', 'bottom', 'left']
  peripheral.forEach(n => {
    const p = (n.pos || '') as 'top' | 'bottom' | 'left' | 'right'
    let zone: 'top' | 'bottom' | 'left' | 'right'
    if (p in zoneCount) {
      zone = p
    } else {
      zone = cycle[0]
      for (const c of cycle) if (zoneCount[c] < zoneCount[zone]) zone = c
    }
    zones[zone].push(n)
    zoneCount[zone]++
  })

  // 画布高度根据内容动态调整（比上一版整体缩减 10%，卡片更紧凑）
  const hasTop = zones.top.length > 0
  const hasBottom = zones.bottom.length > 0
  const hasLeftRight = zones.left.length + zones.right.length > 0
  const H = hasTop && hasBottom ? 468 : hasTop || hasBottom ? 414 : hasLeftRight ? 396 : 378
  if (diagramHeight.value !== H) diagramHeight.value = H
  const cx = W / 2
  const cy = H / 2

  const layouts: NodeLayout[] = []
  const put = (n: GNode, x: number, y: number, sz: { w: number; h: number; fontSize: number; rx: number }) => {
    layouts.push({ id: n.id, x: x - sz.w / 2, y: y - sz.h / 2, w: sz.w, h: sz.h, name: n.name, type: n.type, size: n.size, fontSize: sz.fontSize, rx: sz.rx, pos: n.pos })
  }

  // 中心人物
  put(center, cx, cy, dynSize(center.name, 'large', 176))

  // 辅助函数：一排内均匀排布节点
  const placeRow = (arr: GNode[], y: number, sizeKey: 'medium' | 'small', minGap: number, maxW: number) => {
    if (!arr.length) return
    const n = arr.length
    const avail = W - 64
    const perMax = Math.max(72, Math.min(maxW, (avail - minGap * (n - 1)) / n))
    const items = arr.map(it => ({ it, sz: dynSize(it.name, sizeKey, Math.floor(perMax)) }))
    const totalW = items.reduce((a, x) => a + x.sz.w, 0)
    const gap = Math.max(minGap, Math.min(48, (avail - totalW) / Math.max(n - 1, 1)))
    let x = cx - (totalW + gap * (n - 1)) / 2
    if (x < 24) x = 24
    items.forEach(({ it, sz }) => {
      put(it, x + sz.w / 2, y, sz)
      x += sz.w + gap
    })
  }

  // 上方节点：水平一排
  if (zones.top.length) {
    const topY = cy - 150
    placeRow(zones.top, topY, 'medium', 24, 140)
  }

  // 下方节点：水平一排
  if (zones.bottom.length) {
    const bottomY = cy + 150
    placeRow(zones.bottom, bottomY, 'small', 24, 130)
  }

  // 左侧节点：纵向堆叠（适当向外延伸）
  if (zones.left.length) {
    const leftX = Math.min(200, Math.max(110, cx - 290))
    const n = zones.left.length
    const sp = Math.min(64, Math.max(52, (H - 280) / Math.max(n + 1, 1)))
    const startY = cy - ((n - 1) * sp) / 2
    zones.left.forEach((nd, i) => {
      put(nd, leftX, startY + i * sp, dynSize(nd.name, nd.size as any || 'medium', 140))
    })
  }

  // 右侧节点：纵向堆叠（适当向外延伸）
  if (zones.right.length) {
    const rightX = Math.max(W - 200, Math.min(W - 110, cx + 290))
    const n = zones.right.length
    const sp = Math.min(64, Math.max(52, (H - 280) / Math.max(n + 1, 1)))
    const startY = cy - ((n - 1) * sp) / 2
    zones.right.forEach((nd, i) => {
      put(nd, rightX, startY + i * sp, dynSize(nd.name, nd.size as any || 'medium', 140))
    })
  }

  return layouts
})

// 是否有图可展示：仅当中心人物之外至少还有 1 个真实关联节点时才渲染，否则显示"暂无关系数据"
const hasRelations = computed(() => nodeLayouts.value.length > 1)

const edgeLayouts = computed<EdgeLayout[]>(() => {
  const map = new Map(nodeLayouts.value.map(n => [n.id, n]))
  const out: EdgeLayout[] = []
  gEdges.value.forEach(e => {
    const s = map.get(e.source)
    const t = map.get(e.target)
    if (!s || !t) return
    // 新规则：只要边存在且两端节点都在视图中就标记为 isDirect
    out.push({ source: s, target: t, label: e.label, direction: e.direction, isDirect: true })
  })
  return out
})

// ===== 智能连接点：上下左右四种接法，连线始终贴节点边缘，避免从顶部硬接 =====
type Side = 'left' | 'right' | 'top' | 'bottom'
function anchorPoint(n: NodeLayout, side: Side, spread = 0) {
  switch (side) {
    case 'left': return { x: n.x, y: n.y + n.h / 2 + spread }
    case 'right': return { x: n.x + n.w, y: n.y + n.h / 2 + spread }
    case 'top': return { x: n.x + n.w / 2 + spread, y: n.y }
    case 'bottom': return { x: n.x + n.w / 2 + spread, y: n.y + n.h }
  }
}
/**
 * 根据两节点相对位置选择连接侧边：
 *   完全上下排列 → 上出下入 / 下出上入；完全左右排列 → 右出左入 / 左出右入。
 * 两端锚点都沿各自边缘按相对位置分散（spread），避免多条线汇聚于同一点。
 */
function connectPoints(src: NodeLayout, tgt: NodeLayout) {
  const scx = src.x + src.w / 2
  const scy = src.y + src.h / 2
  const tcx = tgt.x + tgt.w / 2
  const tcy = tgt.y + tgt.h / 2
  const above = src.y + src.h <= tgt.y
  const below = src.y >= tgt.y + tgt.h
  const leftOf = src.x + src.w <= tgt.x
  const rightOf = src.x >= tgt.x + tgt.w
  const relX = clampNum((scx - tcx) / (tgt.w / 2), -1, 1)     // 源相对目标：目标边缘分散
  const relY = clampNum((scy - tcy) / (tgt.h / 2), -1, 1)
  const srcRelX = clampNum((tcx - scx) / (src.w / 2), -1, 1)  // 目标相对源：源边缘分散
  const srcRelY = clampNum((tcy - scy) / (src.h / 2), -1, 1)

  if (above) return {
    a1: anchorPoint(src, 'bottom', srcRelX * src.w * 0.34),
    a2: anchorPoint(tgt, 'top', relX * tgt.w * 0.34)
  }
  if (below) return {
    a1: anchorPoint(src, 'top', srcRelX * src.w * 0.34),
    a2: anchorPoint(tgt, 'bottom', relX * tgt.w * 0.34)
  }
  if (leftOf) return {
    a1: anchorPoint(src, 'right', srcRelY * src.h * 0.3),
    a2: anchorPoint(tgt, 'left', relY * tgt.h * 0.3)
  }
  if (rightOf) return {
    a1: anchorPoint(src, 'left', srcRelY * src.h * 0.3),
    a2: anchorPoint(tgt, 'right', relY * tgt.h * 0.3)
  }

  // 上下/左右重叠：取主方向
  if (Math.abs(tcx - scx) >= Math.abs(tcy - scy)) {
    return tcx >= scx
      ? { a1: anchorPoint(src, 'right', srcRelY * src.h * 0.3), a2: anchorPoint(tgt, 'left', relY * tgt.h * 0.3) }
      : { a1: anchorPoint(src, 'left', srcRelY * src.h * 0.3), a2: anchorPoint(tgt, 'right', relY * tgt.h * 0.3) }
  }
  return tcy >= scy
    ? { a1: anchorPoint(src, 'bottom', srcRelX * src.w * 0.34), a2: anchorPoint(tgt, 'top', relX * tgt.w * 0.34) }
    : { a1: anchorPoint(src, 'top', srcRelX * src.w * 0.34), a2: anchorPoint(tgt, 'bottom', relX * tgt.w * 0.34) }
}

// 柔和贝塞尔曲线：控制点沿连线主方向延伸并带轻微垂直弧度；节点、连线、标签共用同一套坐标
function curveData(src: NodeLayout, tgt: NodeLayout) {
  const { a1, a2 } = connectPoints(src, tgt)
  const dx = a2.x - a1.x
  const dy = a2.y - a1.y
  const len = Math.max(Math.hypot(dx, dy), 1)
  const k = Math.min(len * 0.38, 90)
  const ux = dx / len
  const uy = dy / len
  // 轻微垂直偏移形成自然弧度（直线段越长弧度越大，但不超过 16）
  const bow = Math.min(16, len * 0.05)
  const px = -uy * bow
  const py = ux * bow
  const c1 = { x: a1.x + ux * k + px, y: a1.y + uy * k + py }
  const c2 = { x: a2.x - ux * k + px, y: a2.y - uy * k + py }
  return {
    d: `M ${a1.x} ${a1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${a2.x} ${a2.y}`,
    mid: {
      x: (a1.x + 3 * c1.x + 3 * c2.x + a2.x) / 8,
      y: (a1.y + 3 * c1.y + 3 * c2.y + a2.y) / 8
    }
  }
}
function getEdgePath(src: NodeLayout, tgt: NodeLayout): string {
  return curveData(src, tgt).d
}
// 标签位置 + 碰撞检测：标签先落在连线中点，检测与所有节点矩形及已放置标签是否重叠，
// 沿最小推离方向逐步移开，直到无碰撞；最后把胶囊中心钳制在画布内。
// 保证标签不遮挡节点、标签之间不互相覆盖、也不会被推出画布。
// 胶囊沿用「上一个版本」的小号样式：h=18、文字上移 6px（rect 顶部 y-15）。
const edgeLabelPositions = computed(() => {
  const positions = new Map<string, { x: number; y: number }>()
  const edges = edgeLayouts.value
  const nodes = nodeLayouts.value
  const W = diagramWidth.value
  const H = diagramHeight.value
  // 已放置标签，记录其胶囊中心 (cx, cy)，用于标签之间的避让
  const placed: { cx: number; cy: number; w: number; h: number }[] = []

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]
    if (!edge.label) continue

    const mid = curveData(edge.source, edge.target).mid
    let x = mid.x
    let y = mid.y

    // 标签按叙事文字长度自适应；胶囊中心：rect 顶部在 y-15、高 18 → 中心在 y-6
    const labelW = Math.max(48, edge.label.length * 12 + 24)
    const labelH = 18
    const margin = 3
    const labelCY = () => y - 6

    for (let attempt = 0; attempt < 30; attempt++) {
      let collided = false
      let pushX = 0
      let pushY = 0
      let minPush = Infinity

      // 与单个矩形检测碰撞，记录最小推离方向（推动胶囊中心）
      const collide = (rx: number, ry: number, rw: number, rh: number) => {
        const lx = x - labelW / 2 - margin
        const ly = labelCY() - labelH / 2 - margin
        const lx2 = x + labelW / 2 + margin
        const ly2 = labelCY() + labelH / 2 + margin
        if (lx < rx + rw && lx2 > rx && ly < ry + rh && ly2 > ry) {
          const pushes = [
            { dx: rx + rw - lx, dy: 0 },
            { dx: rx - lx2, dy: 0 },
            { dx: 0, dy: ry + rh - ly },
            { dx: 0, dy: ry - ly2 }
          ]
          for (const p of pushes) {
            const dist = Math.abs(p.dx) + Math.abs(p.dy)
            if (dist < minPush) {
              minPush = dist
              pushX = p.dx
              pushY = p.dy
            }
          }
          return true
        }
        return false
      }

      // 与所有节点矩形检测
      for (const node of nodes) {
        if (collide(node.x, node.y, node.w, node.h)) collided = true
      }
      // 与已放置的标签检测，避免标签互相遮挡
      for (const p of placed) {
        if (collide(p.cx - p.w / 2, p.cy - p.h / 2, p.w, p.h)) collided = true
      }

      if (!collided) break
      x += pushX
      y += pushY
      // 已无可用推离方向，终止避免死循环
      if (pushX === 0 && pushY === 0) break
    }

    // 收尾：把胶囊中心限制在画布内，避免标签被推出边界
    const cy = clampNum(y - 6, labelH / 2 + 6, H - labelH / 2 - 6)
    y = cy + 6
    x = clampNum(x, labelW / 2 + 6, W - labelW / 2 - 6)

    positions.set(`el${i}`, { x, y })
    placed.push({ cx: x, cy, w: labelW, h: labelH })
  }
  return positions
})

// ===== 交互：悬停高亮联动 =====
const hoveredNode = ref<string | null>(null)
const isNodeDimmed = (id: string) => hoveredNode.value !== null && id !== hoveredNode.value
const isEdgeDimmed = (e: EdgeLayout) => {
  if (hoveredNode.value === null) return false
  return e.source.id !== hoveredNode.value && e.target.id !== hoveredNode.value
}

const onNodeClick = (node: NodeLayout) => {
  if (node.size === 'large') return
  if (node.type === 'person') navigateToPerson(node.name)
  else if (node.type === 'event') navigateToEvent(node.name)
}

const navigateToEvent = (name: string) => {
  const ev = (jsonData.value?.events || []).find(e => e.name === name) || events.find(e => e.name === name)
  if (ev) router.push(`/event/${ev.id}`)
}

const handleResize = () => {
  if (diagramContainer.value) {
    const rect = diagramContainer.value.getBoundingClientRect()
    diagramWidth.value = Math.max(420, Math.floor(rect.width))
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  // 尝试加载 JSON 数据（覆盖全部有 JSON 的朝代，含 106 秦；mock 朝代 404 时自动回退）
  const data = await tryLoadPersonStoryData(personId)
  if (data) {
    jsonData.value = data
  }

  await nextTick()
  handleResize()
  // ResizeObserver：容器尺寸变化（窗口/布局/文字）时重新计算，节点与连线始终同步
  if (diagramContainer.value) {
    resizeObserver = new ResizeObserver(() => handleResize())
    resizeObserver.observe(diagramContainer.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
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
            <div class="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 ml-5">
              <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded-sm" style="background: #C34739;"></span>
                <span class="text-xs text-[#4A4A3A]/55">核心人物</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded-sm border" style="border-color: #C34739; background: #FDFBF7;"></span>
                <span class="text-xs text-[#4A4A3A]/55">人物</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded-sm border" style="border-color: #355C5A; background: #F8F6F2;"></span>
                <span class="text-xs text-[#4A4A3A]/55">事件</span>
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
                v-if="hasRelations"
                :width="diagramWidth"
                :height="diagramHeight"
                :viewBox="`0 0 ${diagramWidth} ${diagramHeight}`"
                class="w-full relative z-10"
                style="display: block;"
              >
                <defs>
                  <!-- Drop shadow filter -->
                  <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2C2C2C" flood-opacity="0.08"/>
                  </filter>
                </defs>

                <!-- Edges：柔和贝塞尔曲线 + 叙事标签 -->
                <g
                  v-for="(edge, ei) in edgeLayouts"
                  :key="'e' + ei"
                  :opacity="isEdgeDimmed(edge) ? 0.12 : 0.72"
                  style="transition: opacity .25s;"
                >
                  <path
                    :d="getEdgePath(edge.source, edge.target)"
                    fill="none"
                    :stroke="relationColor(edge.label) || '#5C7A5E'"
                    stroke-opacity="0.8"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <!-- 叙事标签：小号米白胶囊（回退上一个版本的样式），碰撞检测自动避让节点与其他标签 -->
                  <g v-if="edge.label">
                    <rect
                      :x="(edgeLabelPositions.get('el' + ei) || { x: 0 }).x - Math.max(48, edge.label.length * 12 + 24) / 2"
                      :y="(edgeLabelPositions.get('el' + ei) || { y: 0 }).y - 15"
                      :width="Math.max(48, edge.label.length * 12 + 24)"
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
                </g>

                <!-- Nodes：叙事节点 -->
                <g
                  v-for="node in nodeLayouts"
                  :key="node.id"
                  :class="(node.type === 'person' || node.type === 'event' || node.type === 'story') && node.size !== 'large' ? 'cursor-pointer' : ''"
                  :opacity="isNodeDimmed(node.id) ? 0.3 : 1"
                  @click="onNodeClick(node)"
                  @mouseenter="hoveredNode = node.id"
                  @mouseleave="hoveredNode = null"
                  filter="url(#nodeShadow)"
                  style="transition: opacity .25s;"
                >
                  <rect
                    :x="node.x"
                    :y="node.y"
                    :width="node.w"
                    :height="node.h"
                    :rx="node.rx"
                    :fill="node.size === 'large' ? '#C34739' : (nodeColorMap[node.type]?.bg || '#F5F2EC')"
                    :stroke="node.size === 'large' ? '#C34739' : (nodeColorMap[node.type]?.border || '#D8B26A')"
                    :stroke-width="node.size === 'large' ? 2.5 : 1.5"
                  />
                  <!-- 核心人物特殊：金色内嵌描边 -->
                  <rect
                    v-if="node.size === 'large'"
                    :x="node.x + 4"
                    :y="node.y + 4"
                    :width="node.w - 8"
                    :height="node.h - 8"
                    :rx="node.rx - 2"
                    fill="none"
                    stroke="#D8B26A"
                    stroke-opacity="0.45"
                    stroke-width="1"
                  />
                  <!-- Subtle inner highlight -->
                  <rect
                    :x="node.x + 2"
                    :y="node.y + 2"
                    :width="node.w - 4"
                    :height="node.h / 2 - 2"
                    :rx="node.rx - 1"
                    fill="white"
                    :fill-opacity="node.size === 'large' ? 0.15 : 0.3"
                  />
                  <text
                    :x="node.x + node.w / 2"
                    :y="node.y + node.h / 2 + 1"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :fill="node.size === 'large' ? '#FFFFFF' : (nodeColorMap[node.type]?.text || '#2C2C2C')"
                    :font-size="node.fontSize"
                    :font-weight="node.size === 'large' ? 'bold' : 'normal'"
                    :font-family="node.size === 'large' ? 'Ma Shan Zheng, KaiTi, serif' : 'Noto Serif SC, serif'"
                    :letter-spacing="node.size === 'large' ? '2' : '1'"
                  >{{ node.name }}</text>
                </g>
              </svg>

              <!-- Empty state -->
              <div v-if="!hasRelations" class="flex items-center justify-center py-20 text-[#4A4A3A]/35 text-sm">
                <div class="text-center">
                  <svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  暂无关系数据
                </div>
              </div>
            </div>

            <!-- Diagram hint -->
            <p class="text-xs text-[#4A4A3A]/35 text-center mt-3" v-if="hasRelations">
              点击人物 / 事件节点可跳转至对应详情页
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