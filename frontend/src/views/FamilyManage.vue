<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FamilyMember, FamilyRelation, RelationKind } from '@/types/family'
import {
  getAllMembers, getAllRelations, deleteMember, addRelation, deleteRelation,
  exportFamilyData, downloadBackup, clearFamilyData, seedDemoFamily
} from '@/services/familyStore'

const router = useRouter()
const loaded = ref(false)

const members = ref<FamilyMember[]>([])
const relations = ref<FamilyRelation[]>([])
const memberName = (id: string) => members.value.find(m => m.id === id)?.name || '未知'

async function load() {
  const [ms, rs] = await Promise.all([getAllMembers(), getAllRelations()])
  members.value = ms
  relations.value = rs
  loaded.value = true
}
onMounted(load)

/* ===================== 删除确认 ===================== */
const showDeleteConfirm = ref(false)
const memberToDelete = ref<FamilyMember | null>(null)
function askDelete(m: FamilyMember) {
  memberToDelete.value = m
  showDeleteConfirm.value = true
}
async function confirmDelete() {
  const m = memberToDelete.value
  if (!m) return
  await deleteMember(m.id)
  showDeleteConfirm.value = false
  memberToDelete.value = null
  await load()
}

/* ===================== 新增关系 ===================== */
const relForm = ref({
  fromId: '',
  kind: '' as RelationKind | '',
  toId: ''
})
const relError = ref('')
const kindLabels: Record<string, string> = {
  parent: '父母 → 子女',
  child: '子女 → 父母',
  spouse: '配偶',
  sibling: '兄弟姐妹',
  custom: '自定义关系'
}
function addNewRelation() {
  relError.value = ''
  if (!relForm.value.fromId || !relForm.value.toId || !relForm.value.kind) {
    relError.value = '请完整选择关系'
    return
  }
  if (relForm.value.fromId === relForm.value.toId) {
    relError.value = '不能与自己建立关系'
    return
  }
  addRelation(relForm.value.fromId, relForm.value.toId, relForm.value.kind as RelationKind)
    .then(load)
  relForm.value.fromId = ''
  relForm.value.toId = ''
  relForm.value.kind = ''
}

/* ===================== 关系展示 ===================== */
const relationList = computed(() => {
  // 只显示每条关系的主记录（避免配偶/兄弟的双向重复显示）
  const seen = new Set<string>()
  const out: { id: string; fromName: string; toName: string; kind: RelationKind }[] = []
  for (const r of relations.value) {
    const key = r.kind === 'parent'
      ? `${r.fromId}->${r.toId}:parent`
      : [r.fromId, r.toId].sort().join('|') + ':' + r.kind
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id: r.id, fromName: memberName(r.fromId), toName: memberName(r.toId), kind: r.kind })
  }
  return out
})

async function removeRelation(id: string) {
  // 删除反向关系
  const r = relations.value.find(x => x.id === id)
  if (r) {
    const reverse = relations.value.find(x => x.kind === r.kind && x.fromId === r.toId && x.toId === r.fromId)
    if (reverse) await deleteRelation(reverse.id)
  }
  await deleteRelation(id)
  await load()
}

/* ===================== 导出 / 清空 ===================== */
async function doExport() {
  const data = await exportFamilyData()
  downloadBackup(data)
}

const showClearConfirm = ref(false)
async function confirmClear() {
  await clearFamilyData()
  showClearConfirm.value = false
  await load()
}

const showSeedConfirm = ref(false)
async function confirmSeed() {
  await seedDemoFamily()
  showSeedConfirm.value = false
  await load()
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-white border border-ink-black/10 text-sm text-ink-black focus:outline-none focus:border-dai-blue/50 focus:ring-2 focus:ring-dai-blue/10 transition-all'
</script>

<template>
  <div class="min-h-screen bg-[#F8F6F2] relative pb-24">
    <div class="fixed inset-0 pointer-events-none opacity-40" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22 viewBox=%220 0 100 100%22%3E%3Cfill-rule=%22evenodd%22 clip-rule=%22evenodd%22 d=%22M0 0h100v100H0z%22 fill=%22%23F8F6F2%22/%3E%3Cpath d=%22M20 30c5-5 10-5 15 0s10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0%22 fill=%22none%22 stroke=%22%23D8B26A%22 stroke-width=%220.3%22 opacity=%220.3%22/%3E%3C/svg%3E');"></div>

    <!-- 顶部导航 -->
    <nav class="sticky top-0 z-50 backdrop-blur-md bg-[#F8F6F2]/85 border-b border-[#D8B26A]/20">
      <div class="max-w-5xl mx-auto px-8 py-3 flex items-center justify-between">
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
            <span class="text-[#2C2C2C] font-medium">家族管理</span>
          </div>
        </div>
      </div>
    </nav>

    <section class="pt-12 pb-16 px-8">
      <div class="max-w-5xl mx-auto">
        <!-- 页头 -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="font-serif text-3xl text-ink-black">家族管理</h1>
            <p class="mt-1 text-sm text-ink-black/45">管理家人资料、调整家庭关系、备份与清空数据</p>
          </div>
          <button class="text-sm text-ink-black/50 hover:text-dai-blue transition-colors flex items-center gap-1" @click="router.push('/family')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            返回家族树
          </button>
        </div>

        <!-- 家族成员 -->
        <div class="glass-card rounded-2xl p-7 mb-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-serif text-lg text-ink-black flex items-center gap-2">
              <span class="w-1.5 h-5 bg-vermillion rounded-full"></span>家族成员
            </h2>
            <button class="text-sm text-dai-blue hover:text-vermillion transition-colors" @click="router.push('/family/member/new')">＋ 添加家人</button>
          </div>

          <div v-if="!members.length" class="text-center py-10 text-ink-black/35 text-sm">暂无家人</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="m in members" :key="m.id" class="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-3 border border-ink-black/5">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shrink-0" :style="{ background: m.avatarColor || '#355C5A' }">
                {{ m.name.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-serif text-[15px] text-ink-black truncate">{{ m.name }}</span>
                  <span v-if="m.isSelf" class="text-[10px] px-1.5 py-px rounded-full bg-vermillion/10 text-vermillion">本人</span>
                </div>
                <div class="text-xs text-ink-black/40">{{ m.relationToSelf || '家族成员' }}<template v-if="m.birthYear || m.deathYear"> · {{ m.birthYear || '?' }}—{{ m.deathYear || '今' }}</template></div>
              </div>
              <button class="text-xs text-dai-blue hover:text-vermillion transition-colors shrink-0" @click="router.push(`/family/member/${m.id}/edit`)">编辑</button>
              <button class="text-xs text-ink-black/40 hover:text-vermillion transition-colors shrink-0" @click="askDelete(m)">删除</button>
            </div>
          </div>
        </div>

        <!-- 家庭关系 -->
        <div class="glass-card rounded-2xl p-7 mb-6">
          <h2 class="font-serif text-lg text-ink-black mb-5 flex items-center gap-2">
            <span class="w-1.5 h-5 bg-dai-blue rounded-full"></span>家庭关系
          </h2>

          <!-- 新增关系 -->
          <div class="flex flex-wrap items-end gap-3 mb-6 bg-white/60 rounded-xl p-4 border border-dashed border-dai-blue/25">
            <div class="flex-1 min-w-[140px]">
              <label class="block text-xs text-ink-black/50 mb-1.5">成员</label>
              <select v-model="relForm.fromId" :class="inputCls">
                <option value="">选择成员</option>
                <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
            <div class="min-w-[140px]">
              <label class="block text-xs text-ink-black/50 mb-1.5">关系</label>
              <select v-model="relForm.kind" :class="inputCls">
                <option value="">选择关系</option>
                <option v-for="(label, k) in kindLabels" :key="k" :value="k">{{ label }}</option>
              </select>
            </div>
            <div class="flex-1 min-w-[140px]">
              <label class="block text-xs text-ink-black/50 mb-1.5">对象成员</label>
              <select v-model="relForm.toId" :class="inputCls">
                <option value="">选择成员</option>
                <option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>
            <button class="px-5 py-2.5 rounded-full bg-dai-blue text-white text-sm hover:bg-dai-blue/85 transition-colors" @click="addNewRelation">添加关系</button>
            <p v-if="relError" class="w-full text-xs text-vermillion">{{ relError }}</p>
          </div>

          <div v-if="!relationList.length" class="text-center py-8 text-ink-black/35 text-sm">暂无家庭关系</div>
          <div v-else class="space-y-2">
            <div v-for="r in relationList" :key="r.id" class="flex items-center gap-3 bg-white/60 rounded-xl px-4 py-2.5">
              <span class="font-serif text-sm text-ink-black">{{ r.fromName }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-dai-blue/10 text-dai-blue shrink-0">{{ kindLabels[r.kind] || r.kind }}</span>
              <span class="font-serif text-sm text-ink-black">{{ r.toName }}</span>
              <button class="ml-auto text-ink-black/35 hover:text-vermillion transition-colors shrink-0" @click="removeRelation(r.id)">移除</button>
            </div>
          </div>
        </div>

        <!-- 数据管理 -->
        <div class="glass-card rounded-2xl p-7">
          <h2 class="font-serif text-lg text-ink-black mb-5 flex items-center gap-2">
            <span class="w-1.5 h-5 bg-light-gold rounded-full"></span>数据管理
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white/60 rounded-xl p-5 border border-ink-black/5">
              <div class="font-serif text-base text-ink-black mb-1">载入示例数据</div>
              <p class="text-xs text-ink-black/40 mb-4">清空现有数据并载入一套示例家庭，方便刷新后直接查看家族树与详情页效果</p>
              <button class="px-5 py-2 rounded-full bg-dai-blue/10 text-dai-blue text-sm hover:bg-dai-blue hover:text-white transition-all" @click="showSeedConfirm = true">载入示例数据</button>
            </div>
            <div class="bg-white/60 rounded-xl p-5 border border-ink-black/5">
              <div class="font-serif text-base text-ink-black mb-1">导出备份</div>
              <p class="text-xs text-ink-black/40 mb-4">将全部家族数据下载为 JSON 备份文件，可随时导入恢复</p>
              <button class="px-5 py-2 rounded-full bg-dai-blue/10 text-dai-blue text-sm hover:bg-dai-blue hover:text-white transition-all" @click="doExport">导出备份</button>
            </div>
            <div class="bg-white/60 rounded-xl p-5 border border-ink-black/5">
              <div class="font-serif text-base text-ink-black mb-1">清空数据</div>
              <p class="text-xs text-ink-black/40 mb-4">删除全部家族数据，此操作不可恢复，请谨慎</p>
              <button class="px-5 py-2 rounded-full bg-vermillion/10 text-vermillion text-sm hover:bg-vermillion hover:text-white transition-all" @click="showClearConfirm = true">清空数据</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 删除成员确认 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm && memberToDelete" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-ink-black/35 backdrop-blur-sm" @click="showDeleteConfirm = false"></div>
          <div class="relative bg-[#F8F6F2] rounded-2xl shadow-2xl max-w-md w-full p-7">
            <h3 class="font-serif text-xl text-ink-black mb-2">删除「{{ memberToDelete.name }}」？</h3>
            <p class="text-sm text-ink-black/50 mb-5">删除后：</p>
            <ul class="text-sm text-ink-black/60 space-y-2 mb-7">
              <li class="flex items-start gap-2"><span class="text-vermillion mt-0.5">•</span>人物资料将被删除</li>
              <li class="flex items-start gap-2"><span class="text-vermillion mt-0.5">•</span>该人物的照片和故事将被删除</li>
              <li class="flex items-start gap-2"><span class="text-vermillion mt-0.5">•</span>与该人物相关的历史关联将解除</li>
            </ul>
            <div class="flex gap-3">
              <button class="flex-1 py-2.5 rounded-full bg-white border border-ink-black/10 text-ink-black text-sm hover:bg-ink-black/5 transition-colors" @click="showDeleteConfirm = false">取消</button>
              <button class="flex-1 py-2.5 rounded-full bg-vermillion text-white text-sm hover:bg-vermillion/85 transition-colors" @click="confirmDelete">确认删除</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 清空确认 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showClearConfirm" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-ink-black/35 backdrop-blur-sm" @click="showClearConfirm = false"></div>
          <div class="relative bg-[#F8F6F2] rounded-2xl shadow-2xl max-w-md w-full p-7">
            <h3 class="font-serif text-xl text-ink-black mb-2">清空全部家族数据？</h3>
            <p class="text-sm text-ink-black/50 mb-7">删除后：<br />• 所有家人资料将被删除<br />• 所有故事、照片与历史关联将被删除<br />• 此操作不可恢复，建议先导出备份</p>
            <div class="flex gap-3">
              <button class="flex-1 py-2.5 rounded-full bg-white border border-ink-black/10 text-ink-black text-sm hover:bg-ink-black/5 transition-colors" @click="showClearConfirm = false">取消</button>
              <button class="flex-1 py-2.5 rounded-full bg-vermillion text-white text-sm hover:bg-vermillion/85 transition-colors" @click="confirmClear">确认清空</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 载入示例数据确认 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showSeedConfirm" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-ink-black/35 backdrop-blur-sm" @click="showSeedConfirm = false"></div>
          <div class="relative bg-[#F8F6F2] rounded-2xl shadow-2xl max-w-md w-full p-7">
            <h3 class="font-serif text-xl text-ink-black mb-2">载入示例数据？</h3>
            <p class="text-sm text-ink-black/50 mb-7">将清空当前全部家族数据，并载入一套示例家庭（含家庭关系、人生经历、故事与历史关联），方便直接查看页面效果。</p>
            <div class="flex gap-3">
              <button class="flex-1 py-2.5 rounded-full bg-white border border-ink-black/10 text-ink-black text-sm hover:bg-ink-black/5 transition-colors" @click="showSeedConfirm = false">取消</button>
              <button class="flex-1 py-2.5 rounded-full bg-dai-blue text-white text-sm hover:bg-dai-blue/85 transition-colors" @click="confirmSeed">确认载入</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
