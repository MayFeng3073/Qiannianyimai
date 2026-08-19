import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Timeline from '@/views/Timeline.vue'
import Dynasty from '@/views/Dynasty.vue'
import DynastyEvents from '@/views/DynastyEvents.vue'
import DynastyPersons from '@/views/DynastyPersons.vue'
import Person from '@/views/Person.vue'
import PersonStory from '@/views/PersonStory.vue'
import Event from '@/views/Event.vue'
import Family from '@/views/Family.vue'
import Profile from '@/views/Profile.vue'
import { persons } from '@/mock/data'

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
      component: Dynasty
    },
    {
      path: '/dynasty/:id/events',
      name: 'DynastyEvents',
      component: DynastyEvents
    },
    {
      path: '/dynasty/:id/persons',
      name: 'DynastyPersons',
      component: DynastyPersons
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
      path: '/profile',
      name: 'Profile',
      component: Profile
    }
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

export default router