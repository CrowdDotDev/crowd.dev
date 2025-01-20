<template>
  <div class="flex items-center gap-1">
    <el-popover trigger="hover" placement="top" popper-class="!w-auto">
      <template #reference>
        <div
          class="text-gray-600 text-2xs flex items-center leading-5"
        >
          <i
            class="ri-git-repository-line text-base !text-gray-600 mr-1 h-4 flex items-center"
          />

          <span class="font-semibold">
            {{ pluralize("repository", Object.keys(mappings).length, true) }}
          </span>
        </div>
      </template>

      <p class="text-gray-400 text-sm font-semibold mb-4">
        GitHub repositories
      </p>
      <div class="-my-1 px-1 max-h-44 overflow-auto">
        <article
          v-for="mapping of mappings"
          :key="mapping.url"
          class="py-2 flex items-center flex-nowrap"
        >
          <i
            class="ri-git-repository-line text-base mr-2 h-4 flex items-center"
          />
          <a
            :href="mapping.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs leading-5 max-w-3xs truncate hover:underline !text-black"
          >
            /{{ repoNameFromUrl(mapping.url) }}
          </a>
          <div
            class="ri-arrow-right-line text-gray-400 text-base mx-2 h-4 flex items-center"
          />
          <div class="text-xs leading-5 max-w-3xs truncate">
            {{ mapping.segment.name }}
          </div>
        </article>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import pluralize from 'pluralize';

const props = defineProps<{
  integration: any;
}>();

const mappings = ref([]);

const repoNameFromUrl = (url) => url.split('/').at(-1);

onMounted(() => {
  if (props.integration.status !== 'mapping') {
    IntegrationService.fetchGitHubMappings(props.integration).then((res) => {
      mappings.value = res;
    });
  }
});
</script>

<script lang="ts">
export default {
  name: 'LfGithubStatus',
};
</script>
