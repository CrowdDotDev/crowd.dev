import { defineStore } from 'pinia';
import state from './state';
import actions from './actions';

export const useActivityTypeStore = defineStore(
  'activity-type',
  {
    state,
    actions,
  },
);
