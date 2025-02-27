import { defineStore } from 'pinia';
import state from './state';
import actions from './actions';

export const useCollectionsStore = defineStore(
  'collections-store',
  {
    state,
    actions,
  },
);
