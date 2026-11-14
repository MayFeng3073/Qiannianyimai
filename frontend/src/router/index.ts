import { createRouter, createWebHistory, type NavigationGuard } from 'vue-router'
import Home from '@/views/Home.vue'
import Timeline from '@/views/Timeline.vue'
import Dynasty from '@/views/Dynasty.vue'
import DynastyEvents from '@/views/DynastyEvents.vue'
import DynastyPersons from '@/views/DynastyPersons.vue'
import Person from '@/views/Person.vue'
import PersonStory from '@/views/PersonStory.vue'
import Event from '@/views/Event.vue'
import Family from '@/views/Family.vue'
import FamilyManage from '@/views/FamilyManage.vue'
import FamilyMemberProfile from '@/views/FamilyMemberProfile.vue'
import MemberForm from '@/components/family/MemberForm.vue'
import Profile from '@/views/Profile.vue'
import { persons } from '@/mock/data'

// 旧版遗留的占位朝代 id → 真实朝代 id，避免旧链接落到只有几个人物的假页面
const LEGACY_DYNASTY_IDS: Record<string, string> = {
  '1': '112',
  '2': '107',
  '3': '113',
  '4': '115',
  '5': '116'
}

const legacyDynastyRedirect: NavigationGuard = (to, _from, next) => {
  const realId = LEGACY_DYNASTY_IDS[String(to.params.id)]
  if (realId) {
    next({ path: to.path.replace(/^\/dynasty\/[^/]+/, `/dynasty/${realId}`), replace: true })
  } else {
    next()
  }
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
      beforeEnter: (to, _from, next) => {
        const id = Number(to.params.id)
        const person = persons.find(p => p.id === id)
        if (person?.level === 2) {
          next({ name: 'PersonStory', params: { id: to.params.id } })
        } else {
          next()
        }
      }
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
      component: Family
    },
    {
      path: '/family/member/new',
      name: 'FamilyMemberNew',
      component: MemberForm
    },
    {
      path: '/family/member/:id/edit',
      name: 'FamilyMemberEdit',
      component: MemberForm
    },
    {
      path: '/family/member/:id',
      name: 'FamilyMemberProfile',
      component: FamilyMemberProfile
    },
    {
      path: '/family/manage',
      name: 'FamilyManage',
      component: FamilyManage
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile
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