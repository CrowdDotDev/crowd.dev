import { defineStore } from 'pinia';
import state from './state';
import actions from './actions';

export const useAutomationStore = defineStore(
  'automation',
  {
    state,
    actions,
  },
);
