import Error403Page from '@/modules/layout/components/error-403-page.vue'
import Error404Page from '@/modules/layout/components/error-404-page.vue'
import Error500Page from '@/modules/layout/components/error-500-page.vue'

export default [
  {
    name: 'error403',
    path: '/403',
    component: Error403Page
  },
  {
    name: 'error404',
    path: '/404',
    component: Error404Page
  },
  {
    name: 'error500',
    path: '/500',
    component: Error500Page
  }
]
