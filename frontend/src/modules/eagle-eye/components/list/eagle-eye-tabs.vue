<template>
  <div
    class="flex items-center justify-between pr-8 sticky top-0 z-10 bg-white pl-3 py-8"
  >
    <div class="flex gap-4 items-center">
      <div
        v-for="view of views"
        :key="view.id"
        class="flex items-center gap-4"
      >
        <div
          class="eagle-eye-view-btn"
          :class="{
            selected: activeView.id === view.id,
          }"
          @click="doChangeActiveView(view.id)"
        >
          <lf-icon :name="icons[view.id]" :size="20" />
          <span class="text">{{ view.label }}</span>
        </div>
      </div>
    </div>
    <app-inline-select-input
      v-if="sorter"
      v-model="sorter"
      popper-class="sorter-popper-class"
      placement="bottom-end"
      :options="sorterOptions"
      @change="doChangeSort"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import {
  mapActions,
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const icons = {
  feed: 'eye',
  bookmarked: 'book-bookmark',
};

const store = useStore();
const { doChangeActiveView, doChangeSort } = mapActions('eagleEye');
const { activeView } = mapGetters('eagleEye');

const views = computed(() => Object.values(store.state.eagleEye.views));

const sorter = computed({
  get() {
    return activeView.value?.sorter;
  },
  set() {},
});

const sorterOptions = computed(() => {
  if (activeView.value.id === 'bookmarked') {
    return [
      {
        value: 'individualBookmarks',
        label: 'My bookmarks',
      },
      {
        value: 'teamBookmarks',
        label: 'Team bookmarks',
        description: 'All posts bookmarked by your team',
      },
    ];
  }

  return [
    {
      value: 'relevant',
      label: 'Most relevant',
    },
    {
      value: 'recent',
      label: 'Most recent',
    },
  ];
});
</script>

<style lang="scss" scope>
.eagle-eye-view-btn {
  @apply flex items-center gap-2 px-3 rounded-lg h-8;

  .c-icon {
    @apply text-gray-400;
  }

  .text {
    @apply text-sm text-gray-500;
  }

  &:hover {
    @apply bg-gray-200 cursor-pointer;

    .c-icon,
    .text {
      @apply text-gray-900;
    }
  }

  &.selected {
    @apply bg-primary-50;

    .c-icon {
      @apply text-primary-500;
    }

    .text {
      @apply font-medium text-gray-900;
    }
  }
}
</style>
