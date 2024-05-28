import { defineStore } from 'pinia';
import state from './auth.state';
import getters from './auth.getters';
import actions from './auth.actions';

export const useAuthStore = defineStore(
  'auth',
  {
    state,
    getters,
    actions,
  },
);
