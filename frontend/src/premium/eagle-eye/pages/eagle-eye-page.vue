<template>
  <div class="flex -m-5">
    <div
      class="w-full max-h-screen flex flex-row"
    >
      <div
        :style="cssVars"
        class="basis-2/5 overflow-auto overscroll-contain eagle-eye-settings-wrapper"
      >
        <app-eagle-eye-settings />
      </div>

      <div
        class="basis-full overflow-auto overscroll-contain"
      >
        <div :style="cssVars" class="eagle-eye-list-wrapper">
          <app-eagle-eye-tabs />
          <app-eagle-eye-loading-state
            v-if="isLoading"
            :show-description="activeView.id === 'feed'"
          />
          <app-empty-state-cta
            v-else-if="showEmptyState"
            :icon="emptyStateContent.icon"
            :title="emptyStateContent.title"
            :description="emptyStateContent.description"
          />
          <app-eagle-eye-list v-else :list="list" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import AppEagleEyeTabs from '@/premium/eagle-eye/components/list/eagle-eye-tabs.vue';
import AppEagleEyeSettings from '@/premium/eagle-eye/components/list/eagle-eye-settings.vue';
import AppEagleEyeList from '@/premium/eagle-eye/components/list/eagle-eye-list.vue';
import AppEagleEyeLoadingState from '@/premium/eagle-eye/components/list/eagle-eye-loading-state.vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const store = useStore();

const { activeView, activeViewList } = mapGetters('eagleEye');

const { updateSelectedProjectGroup } = useLfSegmentsStore();

const cssVars = computed(() => {
  const menuWidth = '260px';

  return {
    '--eagle-eye-padding': menuWidth,
  };
});
const list = computed(() => activeViewList.value.posts);
const isLoading = computed(() => {
  if (activeView.value.id === 'feed') {
    return activeViewList.value.loading;
  }

  return activeViewList.value.loading && !list.value.length;
});
const showEmptyState = computed(
  () => !activeViewList.value.loading && !list.value.length,
);
const emptyStateContent = computed(() => {
  if (activeView.value.id === 'feed') {
    return {
      icon: 'ri-search-eye-line',
      title: 'No results found',
      description: 'Try to refine your feed settings',
    };
  }

  return {
    icon: 'ri-bookmark-line',
    title: 'No bookmarks yet',
    description: 'Bookmarked results will appear here',
  };
});

onMounted(() => {
  updateSelectedProjectGroup(null);

  // Prevent new fetch if it still loading results from onboarding
  if (!activeViewList.value.loading) {
    store.dispatch('eagleEye/doFetch', {
      keepPagination: true,
      resetStorage: false,
    });
  }
});
</script>

<script>
export default {
  name: 'AppEagleEye',
};
</script>

<style lang="scss">
.eagle-eye-list-wrapper {
  padding-right: calc(
    calc(calc(100vw - var(--eagle-eye-padding)) - 1400px) /
      2
  );
}

.eagle-eye-settings-wrapper {
  padding-left: calc(
    calc(calc(100vw - var(--eagle-eye-padding)) - 1400px) /
      2
  );
}
</style>
