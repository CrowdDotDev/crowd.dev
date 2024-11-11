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
                class="ri-seo-line text-base !text-gray-600 mr-1 h-4 flex items-center"
              />

              {{ pluralize("keyword", keywords.length, true) }}
            </div>
            •
            <div
              class="text-gray-600 text-2xs flex items-center leading-5 font-medium"
            >
              {{ pluralize("url", urls.length, true) }}
            </div>
          </div>
        </template>

        <div class="max-h-44 overflow-auto -my-1 px-1">
          <template v-if="keywords.length > 0">
            <p class="text-gray-400 text-sm font-semibold mb-4">
              Hacker News keywords
            </p>
            <article
              v-for="keyword of keywords"
              :key="keyword"
              class="flex items-center flex-nowrap mb-4 last:mb-0"
            >
              <i class="ri-seo-line text-[16px] mr-1 h-4 flex items-center" />

              <span class="text-gray-900 text-sm max-w-3xs truncate">{{
                keyword
              }}</span>
            </article>
          </template>

          <template v-if="urls.length > 0">
            <p
              class="text-gray-400 text-sm font-semibold mb-4"
              :class="{ 'mt-4': keywords.length > 0 }"
            >
              Hacker News urls
            </p>

            <article
              v-for="url of urls"
              :key="url"
              class="flex items-center flex-nowrap mb-4 last:mb-0"
            >
              <div
                class="ri-links-line text-[16px] mr-1 h-4 flex items-center"
              />

              <span class="text-gray-900 text-sm max-w-3xs truncate">{{
                url
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
import pluralize from 'pluralize';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const urls = computed<string[]>(() => props.integration.settings.urls);
const keywords = computed<string[]>(() => props.integration.settings.keywords);
</script>

<script lang="ts">
export default {
  name: 'LfHackernewsParams',
};
</script>
