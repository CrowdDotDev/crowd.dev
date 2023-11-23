import { defineStore } from 'pinia';
import state from './state';
import actions from './actions';

export const useUserStore = defineStore(
  'user',
  {
    state,
    actions,
  },
);
