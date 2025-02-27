import { defineStore } from 'pinia';
import state from './state';
import actions from './actions';

export const useInsightsProjectsStore = defineStore(
  'insights-projects-store',
  {
    state,
    actions,
  },
);
