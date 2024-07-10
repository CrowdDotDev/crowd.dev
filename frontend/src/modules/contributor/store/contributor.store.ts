import { defineStore } from 'pinia';
import state from './contributor.state';
import getters from './contributor.getters';
import actions from './contributor.actions';

export const useContributorStore = defineStore(
  'contributor',
  {
    state,
    getters,
    actions,
  },
);
