import routes from '@/modules/plan/plan-routes'
import store from '@/modules/plan/plan-store'
import config from '@/config'

const module = config.isPlanEnabled
  ? {
      routes,
      store
    }
  : {}

export default module
