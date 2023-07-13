<template>
  <div class="relative">
    <el-tabs v-model="model" class="mb-6">
      <el-tab-pane
        v-for="view of views"
        :key="view.id"
        :label="view.label"
        :name="view.id"
      />
    </el-tabs>
    <span
      v-if="showResetView"
      type="button"
      class="btn btn-link btn-link--md btn-link--primary absolute right-0 inset-y-0"
      @click="resetView"
    >
      Reset view
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const showResetView = computed(
  () => store.getters['member/showResetView'],
);
const model = computed({
  get() {
    return Object.values(store.state.member.views).find(
      (v) => v.active,
    ).id;
  },
  set(value) {
    store.dispatch('member/doChangeActiveView', value);
  },
});

const integrations = computed(
  () => store.getters['integration/activeList'] || {},
);

const showInfluential = computed(() => (
  integrations.value.twitter?.status === 'done'
  || integrations.value.github?.status === 'done'
));

const views = computed(() => Object.values(store.state.member.views).filter(
  (v) => v.id !== 'influential' || showInfluential.value,
));

const resetView = () => {
  store.dispatch('member/doResetActiveView');
};
</script>

<script>
export default {
  name: 'AppMemberListTabs',
};
</script>
