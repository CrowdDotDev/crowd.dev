import Vue from 'vue'
import Vuex from 'vuex'
import modules from '@/modules'
import LogRocket from 'logrocket'
import createPlugin from 'logrocket-vuex'

const logrocketPlugin = createPlugin(LogRocket)
Vue.use(Vuex)

let store

/**
 * Creates/Sets the Vuex store
 */
const storeAsync = () => {
  if (!store) {
    store = new Vuex.Store({
      modules: buildStores(),
      plugins:
        process.env.NODE_ENV === 'production'
          ? [logrocketPlugin]
          : []
    })
  }

  return store
}

/**
 * Loads all the stores from the src/modules/ folders
 * @returns {{}}
 */
const buildStores = () => {
  const output = {}

  Object.keys(modules)
    .filter((key) => Boolean(modules[key].store))
    .forEach((key) => {
      output[key] = modules[key].store
    })

  return output
}

/**
 * Builds an initial state for our application store
 *
 * This is especially useful for resetting the store after logout (to prevent data from specific tenants
 * from appearing on other tenants)
 *
 * @returns {{}}
 */
const buildInitialState = () => {
  const modules = buildStores()
  return Object.keys(modules).reduce((acc, moduleKey) => {
    acc[moduleKey] = {}
    if (modules[moduleKey].state) {
      acc[moduleKey] = JSON.parse(
        JSON.stringify(modules[moduleKey].state)
      )
    }

    const subModules = modules[moduleKey].modules
    if (subModules) {
      for (const subModuleKey of Object.keys(subModules)) {
        acc[moduleKey][subModuleKey] = JSON.parse(
          JSON.stringify(subModules[subModuleKey].state)
        )
      }
    }
    return acc
  }, {})
}

export { storeAsync, buildInitialState }
