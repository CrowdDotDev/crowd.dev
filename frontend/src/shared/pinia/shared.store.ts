import { defineStore } from 'pinia';
import state from './shared.state';
import getters from './shared.getters';
import actions from './shared.actions';

export const useSharedStore = defineStore(
  'shared',
  {
    state,
    getters,
    actions,
  },
);
