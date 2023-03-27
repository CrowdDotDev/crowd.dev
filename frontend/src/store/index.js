import { createStore as createVuexStore } from 'vuex';
import createPlugin from 'logrocket-vuex';
import config from '@/config';

import modules from '@/modules';

// eslint-disable-next-line import/no-mutable-exports
let store;

/**
 * Loads all the stores from the src/modules/ folders
 * @returns {{}}
 */
const buildStores = () => {
  const output = {};

  Object.keys(modules)
    .filter((key) => Boolean(modules[key].store))
    .forEach((key) => {
      output[key] = modules[key].store;
    });

  return output;
};

/**
 * Creates/Sets the Vuex store
 */
export const createStore = (LogRocket) => {
  const plugins = config.env === 'production'
    ? [createPlugin(LogRocket)]
    : [];
  if (!store) {
    store = createVuexStore({
      modules: buildStores(),
      plugins,
    });
  }
  return store;
};

/**
 * Builds an initial state for our application store
 *
 * This is especially useful for resetting the store after logout (to prevent data from specific tenants
 * from appearing on other tenants)
 *
 * @returns {{}}
 */
export const buildInitialState = (excludeAuth = false) => {
  const stores = buildStores();

  return Object.keys(stores).reduce((acc, moduleKey) => {
    acc[moduleKey] = {};
    if (
      ['auth', 'tenant'].includes(moduleKey)
      && excludeAuth
    ) {
      acc[moduleKey] = store.state[moduleKey];
    } else if (stores[moduleKey].state) {
      acc[moduleKey] = JSON.parse(
        JSON.stringify(stores[moduleKey].state()),
      );
    }

    const subModules = stores[moduleKey].modules;
    if (subModules) {
      Object.keys(subModules).forEach((subModuleKey) => {
        acc[moduleKey][subModuleKey] = JSON.parse(
          JSON.stringify(subModules[subModuleKey].state()),
        );
      });
    }
    return acc;
  }, {});
};

export { store };
