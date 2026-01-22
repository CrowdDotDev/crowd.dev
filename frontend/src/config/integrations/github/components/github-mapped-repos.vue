<template>
  <!-- Mapped repos with other projects -->
  <div
    v-if="!!mappedReposWithOtherProject?.repositories?.length"
    class="items-center py-2.5 px-4 flex justify-between bg-gray-50"
  >
    <el-popover trigger="hover" placement="top" popper-class="!w-auto">
      <template #reference>
        <span class="text-gray-600 text-2xs flex items-center leading-5 font-semibold">
          Syncing GitHub data from <span class="font-bold px-1"> {{ mappedReposWithOtherProject.project }} project </span>
          for {{ pluralize('repository', mappedReposWithOtherProject.repositories.length, true) }}.
        </span>
      </template>

      <p class="text-gray-400 text-sm font-semibold mb-4">
        Mapped GitHub repositories
      </p>
      <div class="-my-1 px-1 max-h-44 overflow-auto">
        <article
          v-for="repo of mappedReposWithOtherProject.repositories"
          :key="repo.url"
          class="py-2 flex items-center flex-nowrap"
        >
          <lf-icon name="book" :size="16" class="text-gray-600 mr-2" />
          <a
            :href="repo.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs leading-5 max-w-3xs truncate hover:underline !text-black"
          >
            /{{ repoNameFromUrl(repo.url) }}
          </a>
        </article>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import pluralize from 'pluralize';

const props = defineProps<{
  segmentId: string;
}>();

const mappedReposWithOtherProject = ref<{
  project: string;
  repositories: {
    url: string;
  }[];
}>();

const repoNameFromUrl = (url: string) => url.split('/').at(-1);

onMounted(() => {
  // mappedReposWithOtherProject.value = {"project":"Project Test","repositories":[{"url":"https://github.com/emlim23/array-flattener"}]};
  IntegrationService.fetchGitHubMappedRepos(props.segmentId).then((res) => {
    mappedReposWithOtherProject.value = res;
  });
});
</script>

<script lang="ts">
export default {
  name: 'LfGithubMappedRepos',
};
</script>
