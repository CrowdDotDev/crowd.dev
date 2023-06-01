import { createApp } from 'vue';
import VueClickAway from 'vue3-click-away';
import VueGridLayout from 'vue-grid-layout';
import Vue3Sanitize from 'vue-3-sanitize';
import LogRocket from 'logrocket';
import VNetworkGraph from 'v-network-graph';
import VueLazyLoad from 'vue3-lazyload';
import { createPinia } from 'pinia';
import { createRouter } from '@/router';
import { createStore } from '@/store';
import plugins from '@/plugins';
import modules from '@/modules';
import config from '@/config';

import formbricks from '@/plugins/formbricks';

import { init as i18nInit } from '@/i18n';

import { AuthService } from '@/modules/auth/auth-service';
import { AuthToken } from '@/modules/auth/auth-token';
import { TenantService } from '@/modules/tenant/tenant-service';
import 'v-network-graph/lib/style.css';

import App from '@/app.vue';
import { vueSanitizeOptions } from '@/plugins/sanitize';
import marked from '@/plugins/marked';

i18nInit();
/**
 * We're using Immediately Invoked Function Expressions (IIFE) here because of the async/awaits
 * (We should probably revisit/refactor this later to be less confusing)
 */
/* eslint-disable no-param-reassign, no-underscore-dangle, func-names */
(async function () {
  if (config.env === 'production') {
    LogRocket.init('nm6fil/crowddev');
  }

  const app = createApp(App);
  const pinia = createPinia();
  const router = await createRouter();
  const store = await createStore(LogRocket);

  app.use(pinia);

  const isSocialOnboardRequested = AuthService.isSocialOnboardRequested();

  AuthToken.applyFromLocationUrlIfExists();
  await TenantService.fetchAndApply();
  if (isSocialOnboardRequested) {
    await AuthService.socialOnboard();
  }

  app.use(VueGridLayout);
  app.use(Vue3Sanitize, vueSanitizeOptions);
  app.use(VueClickAway);
  app.use(marked);
  app.use(VueLazyLoad);

  app.config.productionTip = process.env.NODE_ENV === 'production';

  app.config.errorHandler = (err) => {
    if (config.env === 'production') {
      LogRocket.captureException(err);
    } else if (config.env === 'local') {
      console.error(err);
    }
  };

  const exists = (el) => Boolean(el);
  Object.keys(modules)
    .map((key) => modules[key].components)
    .filter(exists)
    .forEach((components) => {
      Object.keys(components).forEach((name) => {
        app.component(name, components[name]);
      });
    });

  router.afterEach(() => {
    if (typeof formbricks !== 'undefined') {
      formbricks.registerRouteChange();
    }
  });

  Object.values(plugins).map((plugin) => app.use(plugin));
  app.use(VNetworkGraph);

  app.use(store).use(router).mount('#app');

  if (window.Cypress) {
    window.app = {
      ...app,
      $store: store,
      $router: router,
    };
  }

  if (config.env === 'production' && config.hotjarKey) {
    (function (h, o, t, j, a, r) {
      h.hj = h.hj
        || function (...args) {
          (h.hj.q = h.hj.q || []).push(args);
        };
      h._hjSettings = { hjid: config.hotjarKey, hjsv: 6 };
      [a] = o.getElementsByTagName('head');
      r = o.createElement('script');
      r.async = 1;
      r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
      a.appendChild(r);
    }(
      window,
      document,
      'https://static.hotjar.com/c/hotjar-',
      '.js?sv=',
    ));
  }
}());
