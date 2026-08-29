<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Gender, HistoryTargetType } from '@/types/family'
import {
  getAllMembers, getAllRelations, getMember, getLifeEventsByMember, getStoriesByMember,
  getHistoryLinksByMember, getPhotosByMember, addMember, updateMember, clearMemberExtras,
  addRelation, addLifeEvent, addStory, addHistoryLink, addPhoto
} from '@/services/familyStore'
import { searchHistory, resolveHistoryTarget, recommendHistory, type HistorySearchItem, type HistoryRecommendation } from '@/services/historyResolver'

const route = useRoute()
const router = useRouter()
const editId = computed(() => route.params.id as string | undefined)
const isEdit = computed(() => !!editId.value)

const allMembers = ref<Awaited<ReturnType<typeof getAllMembers>>>([])
const loaded = ref(false)
const saving = ref(false)
const error = ref('')

/* ===================== 表单 ===================== */
const form = reactive({
  name: '',
  gender: '' as Gender,
  isSelf: false,
  birthYear: undefined as number | undefined,
  deathYear: undefined as number | undefined,
  birthPlace: '',
  residence: '',
  occupation: '',
  relationToSelf: '',
  bio: '',
  avatarDataUrl: '',
  avatarColor: ''
})

/* ===== 自定义家庭关系（可增删、可取消） ===== */
interface RelRow { rel: string; memberId: string }
const relRows = ref<RelRow[]>([])
const relRelatives = [
  '父亲', '母亲', '爸爸', '妈妈', '儿子', '女儿', '丈夫', '妻子', '配偶',
  '爷爷', '奶奶', '外公', '外婆', '曾祖父', '曾祖母',
  '哥哥', '姐姐', '弟弟', '妹妹', '兄弟', '姐妹',
  '叔叔', '伯父', '姑姑', '舅舅', '阿姨',
  '侄子', '侄女', '孙子', '孙女', '表哥', '表姐', '堂哥', '堂姐'
]
function addRelRow() { relRows.value.push({ rel: '', memberId: '' }) }
function removeRelRow(i: number) { relRows.value.splice(i, 1) }

/* 关系称呼 → 结构类型映射（用于画树；其余为自定义语义关系）
   '父亲/母亲'、'儿子/女儿'、'兄弟/姐妹' 为加载已有关系时的中性称谓，同样参与映射 */
const PARENT_UP = new Set(['父亲', '爸爸', '母亲', '妈妈', '父亲/母亲'])
const PARENT_DOWN = new Set(['儿子', '女儿', '儿子/女儿'])
const SPOUSE_SET = new Set(['丈夫', '妻子', '配偶', '爱人'])
const SIBLING_SET = new Set(['兄弟', '姐妹', '哥哥', '姐姐', '弟弟', '妹妹', '兄弟/姐妹'])

const lifeEvents = ref<{ year: string; title: string; description: string }[]>([])
const stories = ref<{ year: string; title: string; content: string }[]>([])
const links = ref<{ targetType: HistoryTargetType; targetId: number }[]>([])

/* ===== 家族照片（对应详情页「关于他的记忆」照片，可多选/删除） ===== */
const photos = ref<{ blob: Blob; preview: string }[]>([])
function onPhotoFiles(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const f of Array.from(files)) {
    if (!f.type.startsWith('image/')) continue
    photos.value.push({ blob: f, preview: URL.createObjectURL(f) })
  }
  ;(e.target as HTMLInputElement).value = ''
}
function removePhoto(i: number) {
  URL.revokeObjectURL(photos.value[i].preview)
  photos.value.splice(i, 1)
}

const PALETTE = ['#355C5A', '#C34739', '#D8B26A', '#5C7A5E', '#4A6F7A', '#8B3A2B', '#2E4A48', '#A8835A']
function pickColor(): string {
  let h = 0
  const n = form.name || '家人'
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % PALETTE.length
  return PALETTE[h]
}

const relationOptions = [
  '父亲', '母亲', '爷爷', '奶奶', '外公', '外婆', '哥哥', '姐姐', '弟弟', '妹妹',
  '丈夫', '妻子', '儿子', '女儿', '叔叔', '姑姑', '舅舅', '阿姨', '曾祖父', '曾祖母', '本人'
]

/* 可选成员（排除自己） */
const candidates = computed(() => allMembers.value.filter(m => m.id !== editId.value))

/* ===================== 加载 ===================== */
onMounted(async () => {
  allMembers.value = await getAllMembers()
  if (isEdit.value && editId.value) {
    const m = await getMember(editId.value)
    if (m) {
      form.name = m.name
      form.gender = m.gender || ''
      form.isSelf = !!m.isSelf
      form.birthYear = m.birthYear
      form.deathYear = m.deathYear
      form.birthPlace = m.birthPlace || ''
      form.residence = m.residence || ''
      form.occupation = m.occupation || ''
      form.relationToSelf = m.relationToSelf || ''
      form.bio = m.bio || ''
      form.avatarDataUrl = m.avatarDataUrl || ''
      form.avatarColor = m.avatarColor || ''

      const relations = await getAllRelations()
      relRows.value = []
      /* 关系双向存储（addRelation 自动生成反向记录），此处去重后从当前成员视角载入全部关系 */
      const seen = new Set<string>()
      for (const r of relations) {
        if (r.fromId !== editId.value && r.toId !== editId.value) continue
        const pairKey = [r.fromId, r.toId].sort().join('|')
        if (seen.has(pairKey)) continue
        seen.add(pairKey)
        const selfIsFrom = r.fromId === editId.value
        const memberId = selfIsFrom ? r.toId : r.fromId
        let rel = ''
        if (r.kind === 'parent') rel = selfIsFrom ? '儿子/女儿' : '父亲/母亲'
        else if (r.kind === 'child') rel = selfIsFrom ? '父亲/母亲' : '儿子/女儿'
        else if (r.kind === 'spouse') rel = '配偶'
        else if (r.kind === 'sibling') rel = '兄弟/姐妹'
        else rel = r.note || '自定义关系'
        relRows.value.push({ rel, memberId })
      }

      lifeEvents.value = (await getLifeEventsByMember(editId.value)).map(e => ({
        year: e.year || '', title: e.title, description: e.description || ''
      }))
      stories.value = (await getStoriesByMember(editId.value)).map(s => ({
        year: s.year || '', title: s.title, content: s.content
      }))
      links.value = (await getHistoryLinksByMember(editId.value)).map(l => ({ targetType: l.targetType, targetId: l.targetId }))
      photos.value = (await getPhotosByMember(editId.value)).map(p => ({ blob: p.blob, preview: URL.createObjectURL(p.blob) }))
    }
  } else {
    lifeEvents.value.push({ year: '', title: '', description: '' })
  }
  loaded.value = true
})

onUnmounted(() => {
  photos.value.forEach(p => URL.revokeObjectURL(p.preview))
})

/* ===================== 历史关联搜索 ===================== */
const histQuery = ref('')
const histResults = computed(() => searchHistory(histQuery.value, 10))
function addLink(item: HistorySearchItem) {
  if (links.value.some(l => l.targetType === item.type && l.targetId === item.id)) return
  links.value.push({ targetType: item.type, targetId: item.id })
  histQuery.value = ''
}
function removeLink(i: number) { links.value.splice(i, 1) }

/* ===================== 历史关联 · 系统推荐（系统推荐 + 用户确认） ===================== */
const recommendList = computed<HistoryRecommendation[]>(() => {
  const lifeYears = lifeEvents.value.map(e => parseInt(e.year || '', 10)).filter(y => !isNaN(y))
  return recommendHistory({
    birthYear: form.birthYear,
    deathYear: form.deathYear,
    lifeYears,
    exclude: links.value.map(l => ({ type: l.targetType, id: l.targetId })),
    limit: 6
  })
})
function confirmRecommend(r: HistoryRecommendation) {
  if (links.value.some(l => l.targetType === r.type && l.targetId === r.id)) return
  links.value.push({ targetType: r.type, targetId: r.id })
}

const linkLabel = (t: HistoryTargetType, id: number) => {
  const info = resolveHistoryTarget(t, id)
  return info ? info.name : `${t === 'person' ? '人物' : '事件'} #${id}`
}

/* ===================== 头像上传 ===================== */
function onAvatarFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.avatarDataUrl = reader.result as string }
  reader.readAsDataURL(file)
}

/* ===================== 列表编辑器 ===================== */
function addLifeEventRow() { lifeEvents.value.push({ year: '', title: '', description: '' }) }
function removeLifeEventRow(i: number) { lifeEvents.value.splice(i, 1) }
function addStoryRow() { stories.value.push({ year: '', title: '', content: '' }) }
function removeStoryRow(i: number) { stories.value.splice(i, 1) }

/* ===================== 保存 ===================== */
async function save() {
  if (!form.name.trim()) { error.value = '请填写家人姓名'; return }
  saving.value = true
  error.value = ''
  try {
    const payload = {
      name: form.name.trim(),
      gender: form.gender,
      birthYear: form.birthYear,
      deathYear: form.deathYear,
      birthPlace: form.birthPlace.trim() || undefined,
      residence: form.residence.trim() || undefined,
      occupation: form.occupation.trim() || undefined,
      relationToSelf: form.relationToSelf.trim() || undefined,
      isSelf: form.isSelf,
      bio: form.bio.trim() || undefined,
      avatarDataUrl: form.avatarDataUrl || undefined,
      avatarColor: form.avatarColor || pickColor()
    }

    let memberId: string
    if (isEdit.value && editId.value) {
      await updateMember(editId.value, payload)
      await clearMemberExtras(editId.value)
      memberId = editId.value
    } else {
      const m = await addMember(payload)
      memberId = m.id
    }

    for (const row of relRows.value) {
      if (!row.memberId) continue
      const rel = row.rel.trim()
      if (PARENT_UP.has(rel)) await addRelation(row.memberId, memberId, 'parent')
      else if (PARENT_DOWN.has(rel)) await addRelation(memberId, row.memberId, 'parent')
      else if (SPOUSE_SET.has(rel)) await addRelation(memberId, row.memberId, 'spouse')
      else if (SIBLING_SET.has(rel)) await addRelation(memberId, row.memberId, 'sibling')
      else await addRelation(memberId, row.memberId, 'custom', rel || '自定义关系')
    }

    for (const e of lifeEvents.value) {
      if (!e.title.trim()) continue
      await addLifeEvent({ memberId, year: e.year || undefined, title: e.title.trim(), description: e.description.trim() || undefined })
    }
    for (const s of stories.value) {
      if (!s.title.trim()) continue
      await addStory({ memberId, year: s.year || undefined, title: s.title.trim(), content: s.content.trim(), photoIds: [] })
    }
    for (const l of links.value) {
      await addHistoryLink({ memberId, targetType: l.targetType, targetId: l.targetId, confirmed: true })
    }
    // 家族照片（编辑时 clearMemberExtras 已清空原照片，重新写入全部）
    for (const ph of photos.value) {
      await addPhoto({ ownerId: memberId, blob: ph.blob })
    }

    router.push('/family')
  } finally {
    saving.value = false
  }
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white border border-ink-black/10 text-sm text-ink-black focus:outline-none focus:border-dai-blue/50 focus:ring-2 focus:ring-dai-blue/10 transition-all'
const labelCls = 'block text-xs text-ink-black/50 mb-1.5'
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative pb-24">
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

    <!-- 顶部导航 -->
    <nav class="sticky top-0 z-50 backdrop-blur-md bg-[#F8F6F2]/85 border-b border-[#D8B26A]/20">
      <div class="max-w-4xl mx-auto px-8 py-3 flex items-center justify-between">
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
            <span class="text-[#2C2C2C] font-medium">{{ isEdit ? '编辑家人' : '添加家人' }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- 页头 -->
    <section class="pt-12 pb-6 px-8">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="font-serif text-3xl text-ink-black">{{ isEdit ? '编辑家人' : '添加家人' }}</h1>
          <p class="mt-1 text-sm text-ink-black/45">记录家人的基本信息、家庭关系与人生故事</p>
        </div>
        <button
          class="text-sm text-ink-black/50 hover:text-dai-blue transition-colors flex items-center gap-1"
          @click="router.push('/family')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          返回家族树
        </button>
      </div>
    </section>

    <section class="px-8 pb-16">
      <div class="max-w-4xl mx-auto space-y-6">

        <!-- 基本信息 -->
        <div class="glass-card rounded-2xl p-7">
          <h2 class="font-serif text-lg text-ink-black mb-5 flex items-center gap-2">
            <span class="w-1.5 h-5 bg-vermillion rounded-full"></span>基本信息
          </h2>
          <div class="flex gap-8">
            <!-- 头像 -->
            <div class="shrink-0 flex flex-col items-center gap-3">
              <div
                class="w-24 h-24 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-white"
                :style="{ background: form.avatarColor || pickColor() }"
              >
                <img v-if="form.avatarDataUrl" :src="form.avatarDataUrl" class="w-full h-full rounded-full object-cover" alt="" />
                <span v-else class="font-serif text-4xl">{{ (form.name || '家').charAt(0) }}</span>
              </div>
              <label class="text-xs text-dai-blue hover:text-vermillion cursor-pointer transition-colors">
                上传照片
                <input type="file" accept="image/*" class="hidden" @change="onAvatarFile" />
              </label>
              <div class="flex gap-1.5">
                <button
                  v-for="c in PALETTE"
                  :key="c"
                  class="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                  :class="form.avatarColor === c ? 'border-ink-black scale-110' : 'border-white'"
                  :style="{ background: c }"
                  @click="form.avatarColor = c"
                ></button>
              </div>
            </div>

            <!-- 字段 -->
            <div class="flex-1 grid grid-cols-2 gap-x-5 gap-y-4">
              <div>
                <label :class="labelCls">姓名 *</label>
                <input v-model="form.name" :class="inputCls" placeholder="如：爷爷" />
              </div>
              <div>
                <label :class="labelCls">性别</label>
                <select v-model="form.gender" :class="inputCls">
                  <option value="">未填写</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label :class="labelCls">出生年份</label>
                <input v-model.number="form.birthYear" type="number" :class="inputCls" placeholder="如 1932" />
              </div>
              <div>
                <label :class="labelCls">去世年份</label>
                <input v-model.number="form.deathYear" type="number" :class="inputCls" placeholder="如 2010" />
              </div>
              <div>
                <label :class="labelCls">出生地</label>
                <input v-model="form.birthPlace" :class="inputCls" placeholder="如 浙江绍兴" />
              </div>
              <div>
                <label :class="labelCls">居住地</label>
                <input v-model="form.residence" :class="inputCls" placeholder="如 上海" />
              </div>
              <div>
                <label :class="labelCls">职业</label>
                <input v-model="form.occupation" :class="inputCls" placeholder="如 教师" />
              </div>
              <div>
                <label :class="labelCls">与我的关系</label>
                <input v-model="form.relationToSelf" :class="inputCls" list="relation-options" placeholder="如 祖父" />
                <datalist id="relation-options">
                  <option v-for="r in relationOptions" :key="r" :value="r" />
                </datalist>
              </div>
              <div class="col-span-2 flex items-center justify-between bg-white/60 rounded-xl px-4 py-3 border border-ink-black/10">
                <div>
                  <div class="text-sm text-ink-black/80">这是我本人</div>
                  <div class="text-xs text-ink-black/40">标记后将在家族树中突出显示</div>
                </div>
                <button
                  class="relative w-11 h-6 rounded-full transition-colors"
                  :class="form.isSelf ? 'bg-vermillion' : 'bg-ink-black/15'"
                  @click="form.isSelf = !form.isSelf"
                >
                  <span
                    class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    :class="form.isSelf ? 'left-[22px]' : 'left-0.5'"
                  ></span>
                </button>
              </div>
              <div class="col-span-2">
                <label :class="labelCls">人物简介</label>
                <textarea v-model="form.bio" :class="inputCls" rows="3" placeholder="简要介绍这位家人的生平…"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- 家庭关系 -->
        <div class="glass-card rounded-2xl p-7">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-serif text-lg text-ink-black flex items-center gap-2">
              <span class="w-1.5 h-5 bg-dai-blue rounded-full"></span>家庭关系
            </h2>
            <button class="text-sm text-dai-blue hover:text-vermillion transition-colors" @click="addRelRow">＋ 添加一条关系</button>
          </div>
          <p class="text-xs text-ink-black/40 mb-5">为这位家人自由定义与其他成员的关系称呼并连接对方；添加后可随时移除取消</p>

          <div v-if="!relRows.length" class="py-8 text-center text-sm text-ink-black/35 bg-white/50 rounded-xl border border-dashed border-ink-black/15">
            还没有家庭关系，点击右上角「添加一条关系」开始
          </div>

          <div
            v-for="(row, i) in relRows"
            :key="i"
            class="flex flex-wrap items-end gap-3 mb-3 bg-white/60 rounded-xl px-4 py-3.5 border border-ink-black/5"
          >
            <div class="flex-1 min-w-[200px]">
              <label :class="labelCls">关系称呼</label>
              <input v-model="row.rel" :class="inputCls" list="rel-options" placeholder="如 爷爷、叔叔、表哥…（可自定义）" />
              <datalist id="rel-options">
                <option v-for="r in relRelatives" :key="r" :value="r" />
              </datalist>
            </div>
            <div class="flex-1 min-w-[200px]">
              <label :class="labelCls">关联成员</label>
              <select v-model="row.memberId" :class="inputCls">
                <option value="">选择成员…</option>
                <option v-for="m in candidates" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
            <button
              class="w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-ink-black/35 hover:text-vermillion hover:bg-vermillion/5 transition-colors"
              title="移除这条关系"
              @click="removeRelRow(i)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- 人生经历 -->
        <div class="glass-card rounded-2xl p-7">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-serif text-lg text-ink-black flex items-center gap-2">
              <span class="w-1.5 h-5 bg-dai-blue rounded-full"></span>人生经历
            </h2>
            <button class="text-sm text-dai-blue hover:text-vermillion transition-colors" @click="addLifeEventRow">＋ 添加一段经历</button>
          </div>
          <div v-for="(e, i) in lifeEvents" :key="i" class="flex gap-3 mb-3 items-start">
            <input v-model="e.year" class="w-24 px-3 py-2 rounded-xl bg-white border border-ink-black/10 text-sm text-center" placeholder="年份" />
            <input v-model="e.title" class="flex-1 px-4 py-2 rounded-xl bg-white border border-ink-black/10 text-sm" placeholder="经历标题，如 参加工作" />
            <input v-model="e.description" class="flex-1 px-4 py-2 rounded-xl bg-white border border-ink-black/10 text-sm" placeholder="补充说明（可选）" />
            <button class="mt-2 text-ink-black/35 hover:text-vermillion transition-colors" @click="removeLifeEventRow(i)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <p v-if="!lifeEvents.length" class="text-sm text-ink-black/35 text-center py-4">记录家人人生中的重要节点</p>
        </div>

        <!-- 家族照片（对应详情页「关于他的记忆」照片，可多选/删除） -->
        <div class="glass-card rounded-2xl p-7">
          <div class="flex items-center justify-between mb-2">
            <h2 class="font-serif text-lg text-ink-black flex items-center gap-2">
              <span class="w-1.5 h-5 bg-light-gold rounded-full"></span>家族照片
            </h2>
            <label class="text-sm text-dai-blue hover:text-vermillion transition-colors cursor-pointer">
              ＋ 上传照片
              <input type="file" accept="image/*" multiple class="hidden" @change="onPhotoFiles" />
            </label>
          </div>
          <p class="text-xs text-ink-black/40 mb-5">照片将展示在人物详情页的「关于他的记忆」中</p>

          <div v-if="!photos.length" class="py-8 text-center text-sm text-ink-black/35 bg-white/50 rounded-xl border border-dashed border-ink-black/15">
            还没有照片，点击右上角「上传照片」添加
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="(ph, i) in photos" :key="i" class="relative aspect-[4/3] rounded-xl overflow-hidden border border-ink-black/10 bg-white/60">
              <img :src="ph.preview" class="w-full h-full object-cover" alt="家族照片" />
              <button
                class="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full bg-ink-black/40 text-white hover:bg-vermillion transition-colors"
                title="删除这张照片"
                @click="removePhoto(i)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 人物故事 -->
        <div class="glass-card rounded-2xl p-7">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-serif text-lg text-ink-black flex items-center gap-2">
              <span class="w-1.5 h-5 bg-light-gold rounded-full"></span>人物故事
            </h2>
            <button class="text-sm text-dai-blue hover:text-vermillion transition-colors" @click="addStoryRow">＋ 添加一篇故事</button>
          </div>
          <div v-for="(s, i) in stories" :key="i" class="mb-4 bg-white/60 rounded-xl p-4 border border-ink-black/10">
            <div class="flex gap-3 mb-3">
              <input v-model="s.year" class="w-24 px-3 py-2 rounded-xl bg-white border border-ink-black/10 text-sm text-center" placeholder="年份" />
              <input v-model="s.title" class="flex-1 px-4 py-2 rounded-xl bg-white border border-ink-black/10 text-sm" placeholder="故事标题" />
              <button class="text-ink-black/35 hover:text-vermillion transition-colors" @click="removeStoryRow(i)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <textarea v-model="s.content" class="w-full px-4 py-3 rounded-xl bg-white border border-ink-black/10 text-sm" rows="3" placeholder="讲述这段家族故事…"></textarea>
          </div>
          <p v-if="!stories.length" class="text-sm text-ink-black/35 text-center py-4">用文字留住家族的记忆</p>
        </div>

        <!-- 历史关联 -->
        <div class="glass-card rounded-2xl p-7">
          <h2 class="font-serif text-lg text-ink-black mb-2 flex items-center gap-2">
            <span class="w-1.5 h-5 bg-vermillion rounded-full"></span>历史关联
          </h2>
          <p class="text-xs text-ink-black/40 mb-5">把这位家人与"中国历史"中的人物或事件连接起来</p>

          <!-- 系统推荐 + 用户确认 -->
          <div class="rounded-xl border border-dai-blue/25 bg-dai-blue/5 p-4 mb-5">
            <div class="flex items-center gap-2 mb-1.5">
              <svg class="w-4 h-4 text-dai-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <span class="text-sm font-medium text-ink-black/80">系统推荐</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-dai-blue/15 text-dai-blue">根据出生年份与人生经历自动匹配</span>
            </div>
            <p class="text-xs text-ink-black/45 mb-3">系统已检索"中国历史"中与该家人时代重叠的人物与事件，点击「确认关联」快速建立连接。</p>

            <div v-if="!recommendList.length" class="text-xs text-ink-black/35 py-2 text-center border border-dashed border-dai-blue/30 rounded-lg bg-white/40">
              暂无可匹配的时代内容（大历史近现代部分待收录），也可在下方手动搜索添加。
            </div>
            <div v-else class="space-y-1.5">
              <div
                v-for="r in recommendList"
                :key="r.type + r.id"
                class="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-dai-blue shrink-0"></span>
                <span class="text-sm text-ink-black/80">{{ r.name }}</span>
                <span class="text-xs text-ink-black/35">{{ r.year }} · {{ r.dynasty }}</span>
                <span class="hidden sm:block text-[10px] text-ink-black/35 truncate max-w-[160px]">{{ r.reason }}</span>
                <button
                  class="ml-auto shrink-0 text-xs px-2.5 py-1 rounded-full bg-dai-blue text-white hover:bg-dai-blue/85 transition-colors"
                  @click="confirmRecommend(r)"
                >＋ 确认关联</button>
              </div>
            </div>
          </div>

          <div class="relative mb-4">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-black/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input v-model="histQuery" :class="inputCls" class="!pl-10" placeholder="搜索历史人物或事件，如：抗日战争、改革开放…" />
          </div>
          <div v-if="histQuery.trim()" class="mb-4 max-h-56 overflow-y-auto space-y-1.5">
            <button
              v-for="r in histResults"
              :key="r.type + r.id"
              class="w-full text-left flex items-center gap-2 bg-white/70 rounded-xl px-4 py-2.5 hover:bg-white transition-all"
              @click="addLink(r)"
            >
              <span class="text-sm text-ink-black/80">{{ r.name }}</span>
              <span class="text-xs text-ink-black/35">{{ r.year }} · {{ r.dynasty }}</span>
              <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-ink-black/5 text-ink-black/40">{{ r.type === 'person' ? '人物' : '事件' }}</span>
            </button>
            <p v-if="!histResults.length" class="text-center text-sm text-ink-black/35 py-3">未找到「{{ histQuery }}」</p>
          </div>

          <div v-if="links.length" class="space-y-2">
            <div v-for="(l, i) in links" :key="i" class="flex items-center gap-2 bg-white/70 rounded-xl px-4 py-2.5">
              <span class="w-2 h-2 rounded-full bg-vermillion shrink-0"></span>
              <span class="text-sm text-ink-black/80">{{ linkLabel(l.targetType, l.targetId) }}</span>
              <span class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-ink-black/5 text-ink-black/40">{{ l.targetType === 'person' ? '人物' : '事件' }}</span>
              <button class="text-ink-black/35 hover:text-vermillion transition-colors" @click="removeLink(i)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 提交 -->
        <div class="flex items-center justify-end gap-4 pt-6 border-t border-ink-black/5">
          <p v-if="error" class="text-sm text-vermillion mr-auto">{{ error }}</p>
          <button
            class="px-10 py-3 rounded-full bg-white border border-ink-black/10 text-ink-black text-sm hover:bg-ink-black/5 transition-colors"
            @click="router.push('/family')"
          >取消</button>
          <button
            class="px-10 py-3 rounded-full bg-vermillion text-white text-sm hover:bg-vermillion/85 hover:shadow-lg transition-all disabled:opacity-60"
            :disabled="saving"
            @click="save"
          >{{ saving ? '保存中…' : (isEdit ? '保存修改' : '保存家人') }}</button>
        </div>
      </div>
    </section>
  </div>
</template>
