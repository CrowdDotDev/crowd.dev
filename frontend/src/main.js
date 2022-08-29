import { createApp } from 'vue'
import { createRouter } from '@/router'
import { createStore } from '@/store'
import plugins from '@/plugins'
import modules from '@/modules'
import { setupComponentsFiltersDirectivesAndMixins } from '@/app-module'

import {
  i18n,
  init as i18nInit,
  getElementUILanguage
} from '@/i18n'

i18nInit()

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { AuthToken } from '@/modules/auth/auth-token'
import { TenantService } from '@/modules/tenant/tenant-service'
import { AuthService } from '@/modules/auth/auth-service'
import { SettingsService } from '@/modules/settings/settings-service'

import App from '@/app.vue'
import LogRocket from 'logrocket'

if (process.env.NODE_ENV === 'production') {
  LogRocket.init('kdnqcs/crowddev-app')
}

/**
 * We're using Immediately Invoked Function Expressions (IIFE) here because of the async/await for i18nInit()
 * (We should probably revisit/refactor this later to be less confusing)
 */
;(async function () {
  const app = createApp(App)
  const router = await createRouter()
  const store = await createStore()
  const isSocialOnboardRequested = AuthService.isSocialOnboardRequested()

  AuthToken.applyFromLocationUrlIfExists()
  await TenantService.fetchAndApply()
  if (isSocialOnboardRequested) {
    await AuthService.socialOnboard()
  }
  SettingsService.applyThemeFromTenant()

  setupComponentsFiltersDirectivesAndMixins(app)

  app.use(ElementPlus, { locale: getElementUILanguage() })
  app.config.productionTip =
    process.env.NODE_ENV === 'production'

  document.title = i18n('app.title')

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
