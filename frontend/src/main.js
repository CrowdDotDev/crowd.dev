import { createApp } from 'vue'
import { createRouter } from '@/router'
import { createStore } from '@/store'
import plugins from '@/plugins'
import VueClickAway from 'vue3-click-away'
import modules from '@/modules'
import config from '@/config'

import {
  init as i18nInit,
  getElementUILanguage
} from '@/i18n'

import ElementPlus from 'element-plus'
import VueGridLayout from 'vue-grid-layout'
import { AuthToken } from '@/modules/auth/auth-token'
import { TenantService } from '@/modules/tenant/tenant-service'
import Vue3Sanitize from 'vue-3-sanitize'
import LogRocket from 'logrocket'
import VNetworkGraph from 'v-network-graph'
import 'v-network-graph/lib/style.css'

import App from '@/app.vue'
import { vueSanitizeOptions } from '@/plugins/sanitize'
import marked from '@/plugins/marked'
import posthog from 'posthog-js'

i18nInit()
/**
 * We're using Immediately Invoked Function Expressions (IIFE) here because of the async/awaits
 * (We should probably revisit/refactor this later to be less confusing)
 */
;(async function () {
  if (config.env === 'production') {
    LogRocket.init('nm6fil/crowddev')
  }

  // Initialize posthog for crowd hosted version
  if (!config.isCommunityVersion) {
    posthog.init(config.posthog.apiKey, {
      api_host: config.posthog.host,
      autocapture: false,
      capture_pageview: false,
      persistence: 'cookie'
    })
  }

  const app = createApp(App)
  const router = await createRouter()
  const store = await createStore(LogRocket)

  AuthToken.applyFromLocationUrlIfExists()
  await TenantService.fetchAndApply()

  app.use(ElementPlus, { locale: getElementUILanguage() })
  app.use(VueGridLayout)
  app.use(Vue3Sanitize, vueSanitizeOptions)
  app.use(VueClickAway)
  app.use(marked)
  app.config.productionTip =
    process.env.NODE_ENV === 'production'

  app.config.errorHandler = (err) => {
    if (config.env === 'production') {
      LogRocket.captureException(err)
    }
  }

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
  app.use(VNetworkGraph)

  app.use(store).use(router).mount('#app')

  if (window.Cypress) {
    window.app = {
      ...app,
      $store: store,
      $router: router
    }
  }

  if (config.env === 'production' && config.hotjarKey) {
    ;(function (h, o, t, j, a, r) {
      h.hj =
        h.hj ||
        function () {
          ;(h.hj.q = h.hj.q || []).push(arguments)
        }
      h._hjSettings = { hjid: config.hotjarKey, hjsv: 6 }
      a = o.getElementsByTagName('head')[0]
      r = o.createElement('script')
      r.async = 1
      r.src =
        t + h._hjSettings.hjid + j + h._hjSettings.hjsv
      a.appendChild(r)
    })(
      window,
      document,
      'https://static.hotjar.com/c/hotjar-',
      '.js?sv='
    )
  }
})()
