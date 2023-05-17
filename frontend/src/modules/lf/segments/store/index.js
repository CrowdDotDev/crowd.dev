import { defineStore } from 'pinia';
import state from './state';
import actions from './actions';

export const useLfSegmentsStore = defineStore(
  'lf-segments',
  {
    state,
    actions,
  },
);
