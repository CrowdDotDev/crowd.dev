import state from './state'
import actions from './actions'
import { defineStore } from 'pinia'

export const useActivityTypeStore = defineStore(
  'activity-type',
  {
    state,
    actions
  }
)
