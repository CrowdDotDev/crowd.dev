import { defineStore } from 'pinia';
import state from './state';
import actions from './actions';

export const useFooterStore = defineStore(
  'footer-store',
  {
    state,
    actions,
  },
);
