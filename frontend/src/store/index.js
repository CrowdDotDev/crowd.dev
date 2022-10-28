import { createStore as createVuexStore } from 'vuex'
import modules from '@/modules'
let store

/**
 * Creates/Sets the Vuex store
 */
const createStore = () => {
  if (!store) {
    store = createVuexStore({
      modules: buildStores()
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
const buildInitialState = (excludeAuth = false) => {
  const modules = buildStores()
  console.log(buildStores())
  return Object.keys(modules).reduce((acc, moduleKey) => {
    acc[moduleKey] = {}
    if (
      ['auth', 'tenant'].includes(moduleKey) &&
      excludeAuth
    ) {
      acc[moduleKey] = store.state[moduleKey]
    } else if (modules[moduleKey].state) {
      acc[moduleKey] = JSON.parse(
        JSON.stringify(modules[moduleKey].state())
      )
    }

    const subModules = modules[moduleKey].modules
    if (subModules) {
      for (const subModuleKey of Object.keys(subModules)) {
        acc[moduleKey][subModuleKey] = JSON.parse(
          JSON.stringify(subModules[subModuleKey].state())
        )
      }
    }
    return acc
  }, {})
}

export { createStore, buildInitialState, store }
