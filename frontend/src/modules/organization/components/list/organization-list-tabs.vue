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
  () => store.getters['organization/showResetView'],
);
const model = computed({
  get() {
    return Object.values(
      store.state.organization.views,
    ).find((v) => v.active).id;
  },
  set(value) {
    store.dispatch('organization/doChangeActiveView', value);
  },
});
const views = computed(() => Object.values(store.state.organization.views));

const resetView = () => {
  store.dispatch('organization/doResetActiveView');
};
</script>

<script>
export default {
  name: 'AppOrganizationListTabs',
};
</script>
