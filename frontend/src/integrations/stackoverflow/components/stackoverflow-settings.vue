<template>
  <div>
    <div class="flex items-center gap-1">
      <el-popover trigger="hover" placement="top" popper-class="!w-72">
        <template #reference>
          <div class="flex flex-row gap-1">
            <div
              class="text-gray-600 text-2xs flex items-center leading-5 font-medium"
            >
              <i
                class="ri-price-tag-3-line text-base !text-gray-600 mr-1 h-4 flex items-center"
              />
              {{ tags.length }}
              {{ tags.length !== 1 ? "tags" : "tag" }}
            </div>
            <template v-if="tags.length > 0 && keywords.length > 0">
              •
            </template>
            <div
              class="text-gray-600 text-2xs flex items-center leading-5 font-medium"
            >
              {{ keywords.length }}
              {{ keywords.length !== 1 ? "keywords" : "keyword" }}
            </div>
          </div>
        </template>

        <div class="max-h-44 overflow-auto -my-1 px-1">
          <template v-if="tags.length > 0">
            <p class="text-gray-400 text-[13px] font-semibold mb-4">
              Stack Overflow tags
            </p>
            <article
              v-for="tag of tags"
              :key="tag"
              class="flex items-center flex-nowrap mb-4 last:mb-0"
            >
              <div
                class="ri-price-tag-3-line text-[16px] mr-1 h-4 flex items-center"
              />

              <span class="text-gray-900 text-[13px] max-w-3xs truncate">{{
                tag
              }}</span>
            </article>
          </template>

          <template v-if="keywords.length > 0">
            <p
              class="text-gray-400 text-[13px] font-semibold mb-4"
              :class="{ 'mt-4': tags.length > 0 }"
            >
              Stack Overflow keywords
            </p>

            <article
              v-for="keyword of keywords"
              :key="keyword"
              class="flex items-center flex-nowrap mb-4 last:mb-0"
            >
              <div class="ri-seo-line text-[16px] mr-1 h-4 flex items-center" />

              <span class="text-gray-900 text-[13px] max-w-3xs truncate">{{
                keyword
              }}</span>
            </article>
          </template>
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

const tags = computed<string[]>(() => props.integration.settings.tags);
const keywords = computed<string[]>(() => props.integration.settings.keywords);
</script>

<script lang="ts">
export default {
  name: 'AppGithubSettings',
};
</script>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #9ca3af; /* text-gray-400 */
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background-color: #f3f4f6; /* A light gray background for the track */
}
</style>
