import sharedGetters from '@/shared/store/getters';

export default {
  ...sharedGetters(),
  rows: (state, getters) => state.list.ids.map((id) => (getters.activeView.type === 'conversations'
    ? state.records.conversations[id]
    : state.records.activities[id])),
  find: (state, getters) => (id) => (getters.activeView.type === 'conversations'
    ? state.records.conversation[id]
    : state.records.activities[id]),
};
