import { buildInitialState } from '@/store';

/**
 * Reset Store
 *
 * This middleware runs before rendering /auth/signin route
 *
 * It runs buildInitialState to reset our Vuex store to prevent data leaking from different (and consecutives) signins
 *
 * @param to
 * @param store
 * @returns {Promise<*>}
 */
export default async function ({ to, store }) {
  if (to.path === '/auth/signin') {
    const initialState = buildInitialState();

    store.replaceState(initialState);
  }
}
