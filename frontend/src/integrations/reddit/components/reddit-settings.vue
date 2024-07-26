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
            {{ subreddits.length }}
            {{ subreddits.length !== 1 ? "subreddits" : "subreddit" }}
          </div>
        </template>

        <p class="text-gray-400 text-[13px] font-semibold mb-4">
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

            <span class="text-gray-900 text-[13px] max-w-3xs truncate">{{
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
  name: 'AppRedditSettings',
};
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #9ca3af;
  /* text-gray-400 */
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background-color: #f3f4f6;
  /* A light gray background for the track */
}
</style>
