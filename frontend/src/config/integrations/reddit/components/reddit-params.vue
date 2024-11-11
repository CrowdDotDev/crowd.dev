<template>
  <div>
    <div class="flex items-center gap-1">
      <el-popover trigger="hover" placement="top" popper-class="!w-72">
        <template #reference>
          <div
            class="text-gray-600 text-2xs flex items-center leading-5 font-medium"
          >
            <i
              class="ri-reddit-line text-base !text-gray-600 mr-1 h-4 flex items-center"
            />
            {{ pluralize('subreddit', subreddits.length, true) }}
          </div>
        </template>

        <p class="text-gray-400 text-sm font-semibold mb-4">
          Reddit subreddits
        </p>
        <div class="max-h-44 overflow-auto -my-1 px-1">
          <article
            v-for="subreddit of subreddits"
            :key="subreddit"
            class="flex items-center flex-nowrap mb-4 last:mb-0"
          >
            <i
              class="ri-reddit-line text-[16px] mr-1 h-4 flex items-center"
            />

            <span class="text-gray-900 text-sm max-w-3xs truncate">{{
              subreddit
            }}</span>
          </article>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import pluralize from 'pluralize';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const subreddits = computed<string[]>(
  () => props.integration.settings.subreddits,
);
</script>

<script lang="ts">
export default {
  name: 'LfRedditParams',
};
</script>
