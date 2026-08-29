<script setup lang="ts">
import { computed } from 'vue'
import type { FamilyMember, FamilyRelation, HistoryLink } from '@/types/family'
import { resolveHistoryTarget, type HistoryTargetInfo } from '@/services/historyResolver'

const props = defineProps<{
  members: FamilyMember[]
  relations: FamilyRelation[]
  historyLinks: HistoryLink[]
}>()

const emit = defineEmits<{
  (e: 'select', member: FamilyMember): void
  (e: 'history-select', link: HistoryLink): void
  (e: 'add-member'): void
}>()

/* ============ 布局常量 ============ */
const NODE_W = 148
const NODE_H = 148
const CARD_GAP = 18
const H_GAP = 48
const LEVEL_H = 196
const PAD = 56
const PAD_TOP = 20

const SLOT_W = NODE_W * 2 + CARD_GAP + H_GAP // 每个叶子节点占用的水平宽度

/* 头像占位色板（新中式低饱和色） */
const PALETTE = [
  '#355C5A', '#C34739', '#D8B26A', '#5C7A5E',
  '#4A6F7A', '#8B3A2B', '#2E4A48', '#A8835A'
]

function avatarBg(m: FamilyMember): string {
  if (m.avatarColor) return m.avatarColor
  let h = 0
  for (let i = 0; i < m.name.length; i++) h = (h * 31 + m.name.charCodeAt(i)) % PALETTE.length
  return PALETTE[h]
}

function initial(name: string): string {
  return name ? name.charAt(0) : '？'
}

function yearsText(m: FamilyMember): string {
  const b = m.birthYear
  const d = m.deathYear
  if (b && d) return `${b}—${d}`
  if (b) return `${b}—`
  if (d) return `—${d}`
  return '生卒不详'
}

interface CoupleNode {
  key: string
  a: FamilyMember | null
  b: FamilyMember | null
  children: CoupleNode[]
  x: number
  y: number
  depth: number
  slot: number
}

interface CardItem {
  member: FamilyMember
  left: number
  top: number
}

/** 人物左右侧的历史关联短标签（短虚线连接） */
interface SideTag {
  memberId: string
  side: 'left' | 'right'
  x: number
  y: number
  w: number
  h: number
  links: { link: HistoryLink; info: HistoryTargetInfo }[]
}

interface Layout {
  canvasW: number
  canvasH: number
  offsetX: number
  cards: CardItem[]
  edges: string[]
  tags: SideTag[]
  tagLines: string[]
}

const layout = computed<Layout>(() => {
  const { members, relations, historyLinks } = props

  const empty: Layout = { canvasW: 0, canvasH: 0, offsetX: 0, cards: [], edges: [], tags: [], tagLines: [] }
  if (!members.length) return empty

  /* 1. 关系索引 */
  const childrenMap = new Map<string, string[]>()
  const spouseMap = new Map<string, string>()
  for (const r of relations) {
    if (r.kind === 'parent') {
      const arr = childrenMap.get(r.fromId) || []
      arr.push(r.toId)
      childrenMap.set(r.fromId, arr)
    } else if (r.kind === 'spouse') {
      spouseMap.set(r.fromId, r.toId)
      spouseMap.set(r.toId, r.fromId)
    }
  }

  /* 2. 把成员合并为"家庭单元"（夫妻并排） */
  const mkNode = (a: FamilyMember, b: FamilyMember | null): CoupleNode =>
    ({ key: a.id, a, b, children: [], x: 0, y: 0, depth: 0, slot: 0 })

  const used = new Set<string>()
  const memberToCouple = new Map<string, CoupleNode>()
  const couples: CoupleNode[] = []
  for (const m of members) {
    if (used.has(m.id)) continue
    const spId = spouseMap.get(m.id)
    const sp = spId ? members.find(x => x.id === spId) : undefined
    if (sp && !used.has(sp.id)) {
      const c = mkNode(m, sp)
      couples.push(c)
      memberToCouple.set(m.id, c)
      memberToCouple.set(sp.id, c)
      used.add(m.id)
      used.add(sp.id)
    } else {
      const c = mkNode(m, null)
      couples.push(c)
      memberToCouple.set(m.id, c)
      used.add(m.id)
    }
  }

  /* 3. 建立父子结构 */
  const childSet = new Set<string>()
  for (const cids of childrenMap.values()) for (const c of cids) childSet.add(c)
  for (const c of couples) {
    const arr: CoupleNode[] = []
    const ms = [c.a, c.b].filter((x): x is FamilyMember => !!x)
    for (const m of ms) {
      const cids = childrenMap.get(m.id) || []
      for (const cid of cids) {
        const cc = memberToCouple.get(cid)
        if (cc && !arr.includes(cc)) arr.push(cc)
      }
    }
    c.children = arr
  }

  /* 4. 根节点（没有父母的家庭单元） */
  let roots = couples.filter(c => [c.a, c.b].every(m => !m || !childSet.has(m.id)))
  if (!roots.length) roots = couples

  /* 5. 深度与叶子槽位 */
  let counter = 0
  let maxDepth = 0
  const assign = (n: CoupleNode, depth: number) => {
    n.depth = depth
    n.y = depth * LEVEL_H + PAD_TOP
    maxDepth = Math.max(maxDepth, depth)
    if (!n.children.length) {
      n.slot = counter++
    } else {
      n.children.forEach(ch => assign(ch, depth + 1))
    }
  }
  roots.forEach(r => assign(r, 0))

  /* 6. 水平坐标（子代中点对齐） */
  const computeX = (n: CoupleNode) => {
    if (!n.children.length) {
      n.x = n.slot * SLOT_W + SLOT_W / 2
    } else {
      n.children.forEach(computeX)
      n.x = (n.children[0].x + n.children[n.children.length - 1].x) / 2
    }
  }
  roots.forEach(computeX)

  /* 7. 生成卡片 + 成员中心位置索引 */
  const cards: CardItem[] = []
  const memberCenter = new Map<string, number>()
  const memberTop = new Map<string, number>()
  for (const c of couples) {
    const cy = c.y
    if (c.a && c.b) {
      const leftCenter = c.x - (NODE_W / 2 + CARD_GAP / 2)
      const rightCenter = c.x + (NODE_W / 2 + CARD_GAP / 2)
      cards.push({ member: c.a, left: leftCenter - NODE_W / 2, top: cy })
      cards.push({ member: c.b, left: rightCenter - NODE_W / 2, top: cy })
      memberCenter.set(c.a.id, leftCenter)
      memberCenter.set(c.b.id, rightCenter)
      memberTop.set(c.a.id, cy)
      memberTop.set(c.b.id, cy)
    } else if (c.a) {
      cards.push({ member: c.a, left: c.x - NODE_W / 2, top: cy })
      memberCenter.set(c.a.id, c.x)
      memberTop.set(c.a.id, cy)
    }
  }

  /* 8. 家族关系实线 */
  const edges: string[] = []
  for (const c of couples) {
    if (!c.children.length) continue
    const parentCX = c.x
    const parentBottomY = c.y + NODE_H
    const childY = c.children[0].y
    const connY = childY - 12
    const firstX = c.children[0].x
    const lastX = c.children[c.children.length - 1].x
    edges.push(`M ${parentCX} ${parentBottomY} V ${connY}`)
    if (lastX !== firstX) edges.push(`M ${firstX} ${connY} H ${lastX}`)
    for (const ch of c.children) edges.push(`M ${ch.x} ${connY} V ${childY}`)
  }

  /* 9. 历史关联短标签（人物左右侧，短虚线连接，避免长线交叉遮挡） */
  const leafW = counter * SLOT_W - H_GAP + PAD * 2
  const treeCenter = leafW / 2
  const treeBottom = maxDepth * LEVEL_H + PAD_TOP + NODE_H
  const TAG_H = 26

  const tags: SideTag[] = []
  const tagLines: string[] = []
  const byMember = new Map<string, { link: HistoryLink; info: HistoryTargetInfo }[]>()
  for (const link of historyLinks) {
    const info = resolveHistoryTarget(link.targetType, link.targetId)
    if (!info) continue
    const arr = byMember.get(link.memberId) || []
    arr.push({ link, info })
    byMember.set(link.memberId, arr)
  }
  for (const [memberId, links] of byMember) {
    const cx = memberCenter.get(memberId)
    if (cx == null) continue
    const cy = memberTop.get(memberId) ?? 0
    const first = links[0].info
    // 标签宽度估算：首个关联名称 + 年份；多关联追加 "+N"
    const extra = links.length > 1 ? `  +${links.length - 1}` : ''
    const w = Math.min(150, 24 + first.year.length * 6.5 + (first.name.length + extra.length) * 13)
    const side: 'left' | 'right' = cx < treeCenter ? 'left' : 'right'
    const gap = 12
    const x = side === 'left' ? cx - NODE_W / 2 - gap - w : cx + NODE_W / 2 + gap
    const y = cy + NODE_H / 2 - TAG_H / 2
    tags.push({ memberId, side, x, y, w, h: TAG_H, links })
    // 短虚线：人物侧边 → 标签内侧（同侧相邻标签随节点拉开，不会重叠）
    const nodeEdge = side === 'left' ? cx - NODE_W / 2 : cx + NODE_W / 2
    const tagEdge = side === 'left' ? x + w : x
    tagLines.push(`M ${nodeEdge} ${y + TAG_H / 2} H ${tagEdge}`)
  }

  /* 10. 画布尺寸（含左右侧标签扩展，整体平移 offsetX 保证不越界） */
  const minLeft = Math.min(0, leafW, ...tags.filter(t => t.side === 'left').map(t => t.x))
  const maxRight = Math.max(leafW, ...tags.filter(t => t.side === 'right').map(t => t.x + t.w))
  const offsetX = PAD - minLeft
  const canvasW = maxRight - minLeft + PAD * 2
  const canvasH = treeBottom + 8

  return { canvasW, canvasH, offsetX, cards, edges, tags, tagLines }
})

function relationLabel(m: FamilyMember): string {
  if (m.isSelf) return '本人'
  return m.relationToSelf || '家族成员'
}
</script>

<template>
  <!-- 空状态 -->
  <div
    v-if="members.length === 0"
    class="border-2 border-dashed border-ink-black/10 rounded-2xl py-20 text-center"
  >
    <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-vermillion/5 flex items-center justify-center">
      <svg class="w-10 h-10 text-vermillion/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
    </div>
    <p class="font-serif text-lg text-ink-black/60 mb-2">您的家族树还是空的</p>
    <p class="text-sm text-ink-black/40 mb-8">从记录第一位家人开始，见证家族与时代的关联</p>
    <button
      class="px-8 py-2.5 rounded-full bg-vermillion text-white text-sm hover:bg-vermillion/85 transition-all hover:shadow-lg"
      @click="emit('add-member')"
    >
      ＋ 添加第一位家人
    </button>
  </div>

  <!-- 家族树画布 -->
  <div v-else class="overflow-x-auto horizontal-scroll -mx-2 px-2">
    <div
      class="relative transition-all duration-500"
      :style="{ width: layout.canvasW + 'px', height: layout.canvasH + 'px', transform: `translateX(${layout.offsetX}px)` }"
    >
      <!-- 连线层 -->
      <svg
        class="absolute inset-0 pointer-events-none"
        :width="layout.canvasW"
        :height="layout.canvasH"
        :viewBox="`0 0 ${layout.canvasW} ${layout.canvasH}`"
      >
        <!-- 家族关系实线 -->
        <path
          v-for="(d, i) in layout.edges"
          :key="'e' + i"
          :d="d"
          fill="none"
          stroke="#355C5A"
          stroke-width="1.5"
          stroke-linecap="round"
          opacity="0.55"
        />
        <!-- 历史关联短虚线（人物侧边 → 标签） -->
        <path
          v-for="(d, i) in layout.tagLines"
          :key="'t' + i"
          :d="d"
          fill="none"
          stroke="#C34739"
          stroke-width="1.2"
          stroke-dasharray="3 4"
          stroke-linecap="round"
          opacity="0.7"
        />
      </svg>

      <!-- 人物节点 -->
      <div
        v-for="c in layout.cards"
        :key="c.member.id"
        class="family-node absolute cursor-pointer select-none text-center"
        :style="{ left: c.left + 'px', top: c.top + 'px', width: NODE_W + 'px' }"
        @click.stop="emit('select', c.member)"
      >
        <div class="relative inline-block">
          <div
            class="node-avatar w-[76px] h-[76px] rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white/70"
            :style="{ background: avatarBg(c.member) }"
          >
            <img
              v-if="c.member.avatarDataUrl"
              :src="c.member.avatarDataUrl"
              class="w-full h-full rounded-full object-cover"
              alt=""
            />
            <span v-else class="font-serif text-3xl leading-none">{{ initial(c.member.name) }}</span>
          </div>
          <span
            v-if="c.member.isSelf"
            class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-px rounded-full bg-vermillion text-white shadow"
          >本人</span>
        </div>
        <div class="node-name mt-2 font-serif text-[15px] text-ink-black truncate" :title="c.member.name">{{ c.member.name }}</div>
        <div class="mt-0.5 text-[11px] text-ink-black/45 tracking-wide">{{ yearsText(c.member) }}</div>
        <div class="mt-1.5 text-[10px] text-dai-blue/75">{{ relationLabel(c.member) }}</div>
      </div>

      <!-- 历史关联侧标签（人物左右侧） -->
      <button
        v-for="tag in layout.tags"
        :key="'tag' + tag.memberId"
        class="history-tag absolute flex items-center gap-1.5 pl-2 pr-2.5 h-[26px] rounded-full bg-white/90 border border-vermillion/30 shadow-sm hover:shadow-md hover:border-vermillion/60 transition-all"
        :style="{ left: tag.x + 'px', top: tag.y + 'px', width: tag.w + 'px' }"
        :title="tag.links.map(l => `${l.info.name}（${l.info.year}）`).join('；')"
        @click.stop="emit('history-select', tag.links[0].link)"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-vermillion shrink-0"></span>
        <span class="text-[11px] leading-tight text-ink-black/70 truncate min-w-0">
          <span class="text-ink-black/45">{{ tag.links[0].info.year }} </span>{{ tag.links[0].info.name }}<template v-if="tag.links.length > 1"> +{{ tag.links.length - 1 }}</template>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.history-tag {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}

.history-tag:hover {
  transform: translateY(-1px);
}
.family-node {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-avatar {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.family-node:hover {
  transform: translateY(-3px);
}

.family-node:hover .node-avatar {
  transform: scale(1.06);
  box-shadow: 0 10px 24px rgba(44, 44, 44, 0.18);
}

.family-node:hover .node-name {
  color: #355C5A;
}

.node-name {
  transition: color 0.3s ease;
}
</style>
