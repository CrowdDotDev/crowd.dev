import Vue from 'vue'
import PortalVue from 'portal-vue'
import Element from 'element-ui'
import app from '@/app.vue'
import LogRocket from 'logrocket'

import {
  i18n,
  init as i18nInit,
  getElementUILanguage
} from '@/i18n'

import { SettingsService } from '@/modules/settings/settings-service'
import { AuthToken } from '@/modules/auth/auth-token'
import { TenantService } from '@/modules/tenant/tenant-service'
import { AuthService } from '@/modules/auth/auth-service'

Vue.use(PortalVue)
Vue.config.productionTip =
  process.env.NODE_ENV === 'production'

if (process.env.NODE_ENV === 'production') {
  LogRocket.init('kdnqcs/crowddev-app')
}

/**
 * We're using Immediately Invoked Function Expressions (IIFE) here because of the async/await for i18nInit()
 * (We should probably revisit/refactor this later to be less confusing)
 */
;(async function () {
  await i18nInit()
  document.title = i18n('app.title')
  Vue.use(Element, { locale: getElementUILanguage() })

  const { routerAsync } = require('@/router')
  const { storeAsync } = require('@/store')
  const {
    setupComponentsFiltersDirectivesAndMixins
  } = require('@/app-module')
  const isSocialOnboardRequested = AuthService.isSocialOnboardRequested()

  AuthToken.applyFromLocationUrlIfExists()
  await TenantService.fetchAndApply()
  if (isSocialOnboardRequested) {
    await AuthService.socialOnboard()
  }
  SettingsService.applyThemeFromTenant()

  setupComponentsFiltersDirectivesAndMixins()

  const store = storeAsync()
  const router = routerAsync()

  const vueApp = new Vue({
    store,
    router,
    render: (h) => h(app)
  }).$mount('#app')

  if (window.Cypress) {
    window.app = vueApp
  }
})()
