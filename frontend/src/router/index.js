import {
  createRouter as createVueRouter,
  createWebHistory,
} from 'vue-router';

import { store } from '@/store';
import authGuards from '@/middleware/auth';
import modules from '@/modules';
import ProgressBar from '@/shared/progress-bar/progress-bar';
import authGuard from '@/middleware/auth/auth-guard';
import unauthGuard from '@/middleware/auth/unauth-guard';

/**
 * Loads all the routes from src/modules/ folders, and adds the catch-all rule to handle 404s
 *
 * @type {[...*,{redirect: string, path: string}]}
 */
const routes = [
  ...Object.keys(modules)
    .filter((key) => Boolean(modules[key].routes))
    .map((key) => modules[key].routes.map((r) => {
      // eslint-disable-next-line no-param-reassign
      r.meta = {
        ...r.meta,
        middleware: [...authGuards],
      };
      return r;
    }))
    .reduce((a, b) => a.concat(b), []),
  { path: '/:catchAll(.*)', redirect: '/404' },
];
// eslint-disable-next-line import/no-mutable-exports
let router;

/**
 * Creates/Sets Router
 * @returns {Router|{x: number, y: number}}
 */
export const createRouter = () => {
  if (!router) {
    router = createVueRouter({
      history: createWebHistory(),
      routes,
      scrollBehavior() {
        return { x: 0, y: 0 };
      },
    });

    const originalPush = router.push;
    router.push = function push(location) {
      return originalPush
        .call(this, location)
        .catch((error) => {
          console.error(error);
          ProgressBar.done();
        });
    };

    router.beforeEach(async (to, from, next) => {
      if (to.name && to.name !== from.name) {
        ProgressBar.start();
      }
      const matchedRoute = to.matched.find(
        (m) => m.meta.middleware,
      );
      if (matchedRoute !== undefined) {
        const context = {
          from,
          router,
          to,
          store,
          next,
        };

        await authGuard(context);
        await unauthGuard(context);

        next();
      }
    });

    router.afterEach(() => {
      ProgressBar.done();
    });
  }

  return router;
};

export {
  router,
};
