<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FamilyTree from '@/components/family/FamilyTree.vue'
import SlideDrawer from '@/components/family/SlideDrawer.vue'
import type { FamilyMember, FamilyRelation, HistoryLink, LifeEvent, FamilyStory } from '@/types/family'
import {
  getAllMembers, getAllRelations, getAllHistoryLinks,
  getLifeEventsByMember, getStoriesByMember
} from '@/services/familyStore'
import { resolveHistoryTarget } from '@/services/historyResolver'

const router = useRouter()
const isLoaded = ref(false)

/* ===================== 数据 ===================== */
const members = ref<FamilyMember[]>([])
const relations = ref<FamilyRelation[]>([])
const historyLinks = ref<HistoryLink[]>([])
const lifeEventsByMember = ref(new Map<string, LifeEvent[]>())
const storiesByMember = ref(new Map<string, FamilyStory[]>())

async function load() {
  members.value = await getAllMembers()
  relations.value = await getAllRelations()
  historyLinks.value = await getAllHistoryLinks()
  const evMap = new Map<string, LifeEvent[]>()
  const stMap = new Map<string, FamilyStory[]>()
  await Promise.all(members.value.map(async m => {
    const [evs, sts] = await Promise.all([getLifeEventsByMember(m.id), getStoriesByMember(m.id)])
    evMap.set(m.id, evs)
    stMap.set(m.id, sts)
  }))
  lifeEventsByMember.value = evMap
  storiesByMember.value = stMap
}

onMounted(async () => {
  await load()
  setTimeout(() => { isLoaded.value = true }, 100)
})

/* ===================== 概览统计 ===================== */
const stats = computed(() => {
  let events = 0, stories = 0
  for (const evs of lifeEventsByMember.value.values()) events += evs.length
  for (const sts of storiesByMember.value.values()) stories += sts.length
  return { members: members.value.length, events, stories, links: historyLinks.value.length }
})

/* ===================== 家族历史足迹（家族经历 + 大历史关联，合并展示） ===================== */
interface FootItem { year: number; title: string; kind: 'family' | 'history'; memberName?: string; path?: string; note?: string }

const footprint = computed<FootItem[]>(() => {
  const items: FootItem[] = []
  for (const m of members.value) {
    for (const ev of (lifeEventsByMember.value.get(m.id) ?? [])) {
      const y = parseInt(ev.year || '', 10)
      if (!isNaN(y)) items.push({ year: y, title: ev.title, kind: 'family', memberName: m.name })
    }
  }
  // 历史关联：同一目标去重，只保留关键连接，避免重复冗余
  const seenTargets = new Set<string>()
  for (const link of historyLinks.value) {
    const key = `${link.targetType}:${link.targetId}`
    if (seenTargets.has(key)) continue
    seenTargets.add(key)
    const info = resolveHistoryTarget(link.targetType, link.targetId)
    if (!info) continue
    const y = parseInt(info.year.split('—')[0], 10)
    if (!isNaN(y)) items.push({ year: y, title: info.name, kind: 'history', path: info.path, note: info.dynasty })
  }
  items.sort((a, b) => a.year - b.year)
  return items.slice(0, 40).map((it, idx) => ({ ...it, _k: idx }))
})

/* ===================== 人物详情页 ===================== */
function openProfile(m: FamilyMember) {
  router.push(`/family/member/${m.id}`)
}

/* ===================== 搜索抽屉 ===================== */
const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = computed(() => {
  const q = searchQuery.value.trim()
  if (!q) return []
  return members.value.filter(m => m.name.includes(q)).slice(0, 20)
})
function openSearch() {
  searchQuery.value = ''
  showSearch.value = true
}

/* ===================== 工具函数 ===================== */
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
const PALETTE = ['#355C5A', '#C34739', '#D8B26A', '#5C7A5E', '#4A6F7A', '#8B3A2B', '#2E4A48', '#A8835A']
function avatarBg(m: FamilyMember): string {
  if (m.avatarColor) return m.avatarColor
  let h = 0
  for (let i = 0; i < m.name.length; i++) h = (h * 31 + m.name.charCodeAt(i)) % PALETTE.length
  return PALETTE[h]
}
function gotoHistory(link: HistoryLink) {
  const info = resolveHistoryTarget(link.targetType, link.targetId)
  if (info) router.push(info.path)
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative pb-8">
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

    <!-- 顶部导航 -->
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
            <span class="text-[#2C2C2C] font-medium">家族记忆</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- 页头 -->
    <section class="pt-16 pb-2 px-8">
      <div class="max-w-7xl mx-auto text-center" :class="isLoaded ? 'animate-fade-up' : 'opacity-0'">
        <h1 class="font-serif text-4xl md:text-5xl text-ink-black mb-3">家族记忆</h1>
        <p class="text-ink-black/50">建立属于你的家族树，在家人的故事中看见时代的痕迹</p>
      </div>
    </section>

    <!-- 操作栏（无卡片底，宽度80%，上下留白加大） -->
    <section class="px-8 pt-10 pb-6">
      <div class="max-w-[1024px] mx-auto">
        <div
          class="flex flex-wrap items-center gap-3"
          :class="isLoaded ? 'animate-fade-up' : 'opacity-0'"
        >
          <div class="relative flex-1 min-w-[220px]">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-black/35 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              v-model="searchQuery"
              class="w-full pl-10 pr-10 py-2.5 rounded-full bg-white/70 border border-ink-black/10 text-sm text-ink-black placeholder-ink-black/30 focus:outline-none focus:border-dai-blue/50 focus:ring-2 focus:ring-dai-blue/10 transition-all"
              placeholder="搜索家人…"
              @focus="openSearch"
            />
            <button v-if="searchQuery" class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-black/40 hover:text-ink-black" @click="searchQuery = ''">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="flex items-center gap-3">
            <button
              class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-vermillion text-white text-sm hover:bg-vermillion/85 hover:shadow-lg transition-all"
              @click="router.push('/family/member/new')"
            >
              <span class="text-base leading-none">＋</span> 添加家人
            </button>
            <button
              class="flex items-center gap-1.5 px-5 py-2 rounded-full bg-white border border-ink-black/10 text-ink-black text-sm hover:bg-dai-blue hover:text-white hover:border-dai-blue transition-all"
              @click="router.push('/family/manage')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              家族管理
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 概览 -->
    <section class="px-8">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center gap-6 flex-wrap text-sm text-ink-black/50">
          <span><b class="text-ink-black font-serif text-base mr-1">{{ stats.members }}</b>位家人</span>
          <span class="w-1 h-1 rounded-full bg-ink-black/20"></span>
          <span><b class="text-ink-black font-serif text-base mr-1">{{ stats.events }}</b>段人生经历</span>
          <span class="w-1 h-1 rounded-full bg-ink-black/20"></span>
          <span><b class="text-ink-black font-serif text-base mr-1">{{ stats.stories }}</b>篇家族故事</span>
          <span class="w-1 h-1 rounded-full bg-ink-black/20"></span>
          <span><b class="text-ink-black font-serif text-base mr-1">{{ stats.links }}</b>条历史关联</span>
        </div>
      </div>
    </section>

    <!-- 示例数据提示（数据较少时引导载入，便于预览完整效果） -->
    <section v-if="isLoaded && members.length <= 2" class="px-8 mt-5">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dai-blue/25 bg-dai-blue/5 px-5 py-3 text-sm">
          <svg class="w-4 h-4 text-dai-blue shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <span class="text-dai-blue">家人较少，无法完整预览页面效果？</span>
          <span class="text-ink-black/45">家族管理页提供一键「载入示例数据」，可快速体验完整家族树与详情页效果。</span>
          <button
            class="ml-auto shrink-0 px-4 py-1.5 rounded-full bg-dai-blue text-white text-xs hover:bg-dai-blue/85 transition-colors"
            @click="router.push('/family/manage')"
          >去载入示例数据</button>
        </div>
      </div>
    </section>

    <!-- 家族树 -->
    <section class="px-8 py-8">
      <div class="max-w-7xl mx-auto">
        <h2 class="font-serif text-2xl text-ink-black mb-4 flex items-center gap-2">
          我的家族树
          <span class="text-sm text-ink-black/35 font-sans font-normal">点击人物节点查看详情</span>
        </h2>

        <div class="pt-4">
          <FamilyTree
            :members="members"
            :relations="relations"
            :history-links="historyLinks"
            @select="openProfile"
            @history-select="gotoHistory"
            @add-member="router.push('/family/member/new')"
          />
          <div v-if="members.length" class="mt-6 flex flex-wrap items-center gap-8 text-xs text-ink-black/45">
            <span class="flex items-center gap-2">
              <span class="inline-block w-8 h-px bg-dai-blue"></span> 实线：家族关系
            </span>
            <span class="flex items-center gap-2">
              <span class="inline-block w-8 border-t border-dashed border-vermillion"></span> 虚线：历史关联
            </span>
            <span class="flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-vermillion"></span> 点击可跳转大历史
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 家族历史足迹 -->
    <section class="px-8 pb-16">
      <div class="max-w-7xl mx-auto">
        <h2 class="font-serif text-2xl text-ink-black mb-4">家族历史足迹</h2>
        <div class="glass-card rounded-2xl p-6">
          <div v-if="!footprint.length" class="py-12 text-center">
            <p class="text-ink-black/40 mb-1">还没有人生足迹</p>
            <p class="text-sm text-ink-black/30">为家人添加人生经历，或建立与时代大事件的历史关联</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
            <template v-for="item in footprint" :key="item._k">
              <div class="flex items-start gap-3 py-2.5 border-b border-ink-black/5 last:border-0">
                <span
                  class="shrink-0 w-16 text-right font-serif text-sm"
                  :class="item.kind === 'family' ? 'text-vermillion' : 'text-ink-black/40'"
                >{{ item.year }}</span>
                <span class="mt-2 shrink-0 w-5 border-t border-ink-black/15"></span>
                <span
                  class="w-2 h-2 mt-[7px] shrink-0 rounded-full"
                  :class="item.kind === 'family' ? 'bg-vermillion' : 'bg-ink-black/25'"
                ></span>
                <div class="flex-1 min-w-0">
                  <button
                    class="text-sm text-ink-black/80 hover:text-dai-blue transition-colors truncate block"
                    :class="{ 'cursor-pointer': item.path }"
                    @click="item.path && router.push(item.path!)"
                  >{{ item.title }}</button>
                  <div class="text-xs text-ink-black/35">
                    <template v-if="item.kind === 'family'">{{ item.memberName }}</template>
                    <template v-else>{{ item.note || '大历史' }} · 大历史</template>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== 搜索抽屉 ==================== -->
    <SlideDrawer :show="showSearch" title="搜索家人" @close="showSearch = false">
      <div class="relative mb-5">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-black/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          v-model="searchQuery"
          class="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-ink-black/10 text-sm focus:outline-none focus:border-dai-blue/50 transition-all"
          placeholder="输入家人姓名…"
          autofocus
        />
      </div>

      <div v-if="!searchQuery" class="text-center py-16">
        <p class="text-ink-black/35">输入姓名，快速找到家人</p>
      </div>
      <div v-else-if="!searchResults.length" class="text-center py-16">
        <p class="text-ink-black/35">未找到「{{ searchQuery }}」</p>
      </div>
      <div v-else>
        <div class="text-xs text-ink-black/40 mb-3">搜索结果（{{ searchResults.length }}）</div>
        <div
          v-for="m in searchResults"
          :key="m.id"
          class="glass-card rounded-xl p-3.5 mb-2.5 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
          @click="openProfile(m)"
        >
          <div class="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0" :style="{ background: avatarBg(m) }">
            <img v-if="m.avatarDataUrl" :src="m.avatarDataUrl" class="w-full h-full rounded-full object-cover" alt="" />
            <span v-else class="font-serif text-lg">{{ m.name.charAt(0) }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-serif text-[15px] text-ink-black">{{ m.name }}</span>
              <span class="text-xs text-ink-black/40">{{ yearsText(m) }}</span>
            </div>
            <div class="text-xs text-ink-black/45 mt-0.5">{{ relationLabel(m) }}</div>
          </div>
          <span v-if="historyLinks.filter(l => l.memberId === m.id).length" class="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-vermillion/10 text-vermillion">历史关联</span>
        </div>
      </div>
    </SlideDrawer>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
