<template>
  <div class="flex items-center gap-1">
    <el-popover v-if="mappings.length > 0" trigger="hover" placement="top" popper-class="!w-auto">
      <template #reference>
        <slot name="trigger">
          <div
            class="text-neutral-600 text-2xs flex items-center leading-5"
          >
            <lf-icon name="book" :size="16" class="text-neutral-600 mr-1" />
            <span class="font-semibold underline decoration-dashed cursor-default">
              {{ pluralize("repository", Object.keys(mappings).length, true) }}
            </span>
          </div>
        </slot>
      </template>

      <p class="text-neutral-400 text-sm font-semibold mb-4">
        <slot name="popupTitle">
          GitHub repositories
        </slot>
      </p>
      <div class="-my-1 px-1 max-h-44 overflow-auto">
        <article
          v-for="mapping of mappings"
          :key="mapping.url"
          class="py-2 flex items-center flex-nowrap"
        >
          <lf-icon name="book" :size="16" class="text-neutral-600 mr-2" />
          <a
            :href="mapping.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs leading-5 max-w-3xs truncate hover:underline !text-black"
          >
            /{{ repoNameFromUrl(mapping.url) }}
          </a>
          <lf-icon name="arrow-right" :size="16" class="text-neutral-400 mx-2 flex items-center" />
          <div class="text-xs leading-5 max-w-3xs truncate">
            {{ mapping.segment.name }}
          </div>
        </article>
      </div>
    </el-popover>
    <slot v-else name="trigger">
      <div
        class="text-neutral-600 text-2xs flex items-center leading-5"
      >
        <lf-icon name="book" :size="16" class="text-neutral-600 mr-1" />
        <span class="font-semibold underline decoration-dashed cursor-default">
          {{ pluralize("repository", Object.keys(mappings).length, true) }}
        </span>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import pluralize from 'pluralize';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { IntegrationMapping } from '@/modules/admin/modules/integration/types/Integration';

defineProps<{
  mappings: IntegrationMapping[];
}>();

const repoNameFromUrl = (url: string) => url.split('/').at(-1);
</script>

<script lang="ts">
export default {
  name: 'LfGithubMappingsDisplay',
};
</script>
