import { createRouter, createWebHistory, type NavigationGuard } from 'vue-router'
import Home from '@/views/Home.vue'
// 非首屏页面改为按需加载，避免首屏一次性下载全部页面与 echarts
const Timeline = () => import('@/views/Timeline.vue')
const Dynasty = () => import('@/views/Dynasty.vue')
const DynastyEvents = () => import('@/views/DynastyEvents.vue')
const DynastyPersons = () => import('@/views/DynastyPersons.vue')
const Person = () => import('@/views/Person.vue')
const PersonStory = () => import('@/views/PersonStory.vue')
const Event = () => import('@/views/Event.vue')
const Family = () => import('@/views/Family.vue')
const FamilyManage = () => import('@/views/FamilyManage.vue')
const FamilyMemberProfile = () => import('@/views/FamilyMemberProfile.vue')
const MemberForm = () => import('@/components/family/MemberForm.vue')
import { persons } from '@/mock/data'
import { ensureHistoryIndex } from '@/services/historyIndex'

// 旧版遗留的占位朝代 id → 真实朝代 id，避免旧链接落到只有几个人物的假页面
const LEGACY_DYNASTY_IDS: Record<string, string> = {
  '1': '112',
  '2': '107',
  '3': '113',
  '4': '115',
  '5': '116'
}

// 旧版占位人物 id → 真实历史人物 id（占位数据已删除，旧链接透明重定向）
const LEGACY_PERSON_IDS: Record<string, string> = {
  '1': '112042', // 李白
  '2': '112043', // 杜甫
  '3': '112019', // 武则天
  '4': '112002', // 李世民
  '5': '113016', // 苏轼
  '6': '202014', // 孔子
  '7': '107005', // 汉武帝
  '8': '109009', // 诸葛亮
  '9': '109001', // 赵云
  '10': '113014', // 王安石
  '11': '113023', // 岳飞
  '12': '115001' // 朱元璋
}

const legacyDynastyRedirect: NavigationGuard = (to, _from, next) => {
  const realId = LEGACY_DYNASTY_IDS[String(to.params.id)]
  if (realId) {
    next({ path: to.path.replace(/^\/dynasty\/[^/]+/, `/dynasty/${realId}`), replace: true })
  } else {
    next()
  }
}

const personGuard: NavigationGuard = (to, _from, next) => {
  const rawId = String(to.params.id)
  const realId = LEGACY_PERSON_IDS[rawId]
  if (realId) {
    next({ name: 'Person', params: { id: realId }, replace: true })
    return
  }
  const person = persons.find(p => p.id === Number(rawId))
  if (person?.level === 2) {
    next({ name: 'PersonStory', params: { id: rawId } })
  } else {
    next()
  }
}

// 家族页面依赖统一历史索引解析关联；先加载再进入，失败也放行（页面用快照兜底）
const preloadHistory: NavigationGuard = async (_to, _from, next) => {
  await ensureHistoryIndex()
  next()
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/timeline',
      name: 'Timeline',
      component: Timeline
    },
    {
      path: '/dynasty/:id',
      name: 'Dynasty',
      component: Dynasty,
      beforeEnter: legacyDynastyRedirect
    },
    {
      path: '/dynasty/:id/events',
      name: 'DynastyEvents',
      component: DynastyEvents,
      beforeEnter: legacyDynastyRedirect
    },
    {
      path: '/dynasty/:id/persons',
      name: 'DynastyPersons',
      component: DynastyPersons,
      beforeEnter: legacyDynastyRedirect
    },
    {
      path: '/person/:id',
      name: 'Person',
      component: Person,
      beforeEnter: personGuard
    },
    {
      path: '/person/:id/story',
      name: 'PersonStory',
      component: PersonStory
    },
    {
      path: '/event/:id',
      name: 'Event',
      component: Event
    },
    {
      path: '/family',
      name: 'Family',
      component: Family,
      beforeEnter: preloadHistory
    },
    {
      path: '/family/member/new',
      name: 'FamilyMemberNew',
      component: MemberForm,
      beforeEnter: preloadHistory
    },
    {
      path: '/family/member/:id/edit',
      name: 'FamilyMemberEdit',
      component: MemberForm,
      beforeEnter: preloadHistory
    },
    {
      path: '/family/member/:id',
      name: 'FamilyMemberProfile',
      component: FamilyMemberProfile,
      beforeEnter: preloadHistory
    },
    {
      path: '/family/manage',
      name: 'FamilyManage',
      component: FamilyManage,
      beforeEnter: preloadHistory
    }
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // 直接归位：smooth 会让页面在新页面挂载后继续滚动，
    // 与入场动效叠加成"整页上浮/弹跳"的观感。
    return { top: 0 }
  }
})

export default router