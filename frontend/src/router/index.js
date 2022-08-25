import Vue from 'vue'
import Router from 'vue-router'
import ProgressBar from '@/shared/progress-bar/progress-bar'

import authGuards from '@/middleware/auth'
import modules from '@/modules'
import { storeAsync } from '@/store'

Vue.use(Router)

/**
 * Loads all the routes from src/modules/ folders, and adds the catch-all rule to handle 404s
 *
 * @type {[...*,{redirect: string, path: string}]}
 */
const routes = [
  ...Object.keys(modules)
    .filter((key) => Boolean(modules[key].routes))
    .map((key) =>
      modules[key].routes.map((r) => {
        r.meta = {
          ...r.meta,
          middleware: [...authGuards]
        }
        return r
      })
    )
    .reduce((a, b) => a.concat(b), []),
  { path: '*', redirect: '/404' }
]
let router

/**
 * Creates/Sets VueRouter instance
 * @returns {{x: number, y: number}|VueRouter}
 */
const routerAsync = () => {
  const store = storeAsync()

  if (!router) {
    router = new Router({
      mode: 'history',
      routes,
      scrollBehavior() {
        return { x: 0, y: 0 }
      }
    })

    const originalPush = router.push
    router.push = function push(location) {
      return originalPush
        .call(this, location)
        .catch((error) => {
          console.error(error)
          ProgressBar.done()
        })
    }

    router.beforeEach((to, from, next) => {
      if (to.name) {
        ProgressBar.start()
      }

      const matchedRoute = to.matched.find(
        (m) => m.meta.middleware
      )
      if (matchedRoute !== undefined) {
        const middleware = Array.isArray(
          matchedRoute.meta.middleware
        )
          ? matchedRoute.meta.middleware
          : [matchedRoute.meta.middleware]

        const context = {
          from,
          next,
          router,
          to,
          store
        }
        const nextMiddleware = nextFactory(
          context,
          middleware,
          1
        )

        return middleware[0]({
          ...context,
          next: nextMiddleware
        })
      }

      return next()
    })

    router.afterEach(() => {
      ProgressBar.done()
    })
  }

  return router
}

/**
 * Creates a `nextMiddleware()` function which not only
 * runs the default `next()` callback but also triggers
 * the subsequent Middleware function.
 *
 * @param context
 * @param middleware
 * @param index
 * @returns {(function(): void)|*}
 */
function nextFactory(context, middleware, index) {
  const subsequentMiddleware = middleware[index]
  // If no subsequent Middleware exists,
  // the default `next()` callback is returned.
  if (!subsequentMiddleware) return context.next

  return () => {
    const nextMiddleware = nextFactory(
      context,
      middleware,
      index + 1
    )
    subsequentMiddleware({
      ...context,
      next: nextMiddleware
    })
  }
}

export { routerAsync }
