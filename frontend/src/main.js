import { createApp } from 'vue'
import { createRouter } from '@/router'
import { createStore } from '@/store'
import plugins from '@/plugins'
import modules from '@/modules'

import {
  init as i18nInit,
  getElementUILanguage
} from '@/i18n'

import ElementPlus from 'element-plus'
import { AuthToken } from '@/modules/auth/auth-token'
import { TenantService } from '@/modules/tenant/tenant-service'

import App from '@/app.vue'

i18nInit()
/**
 * We're using Immediately Invoked Function Expressions (IIFE) here because of the async/awaits
 * (We should probably revisit/refactor this later to be less confusing)
 */
;(async function () {
  const app = createApp(App)
  const router = await createRouter()
  const store = await createStore()

  AuthToken.applyFromLocationUrlIfExists()
  await TenantService.fetchAndApply()

  app.use(ElementPlus, { locale: getElementUILanguage() })
  app.config.productionTip =
    process.env.NODE_ENV === 'production'

  const exists = (el) => Boolean(el)
  Object.keys(modules)
    .map((key) => modules[key].components)
    .filter(exists)
    .forEach((components) => {
      Object.keys(components).forEach((name) => {
        app.component(name, components[name])
      })
    })

  Object.values(plugins).map((plugin) => {
    app.use(plugin)
  })

  app.use(store).use(router).mount('#app')

  if (window.Cypress) {
    window.app = app
  }
})()
