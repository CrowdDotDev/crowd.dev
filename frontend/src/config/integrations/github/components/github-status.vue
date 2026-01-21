<template>
  <div class="flex flex-col gap-3">
    <div v-if="mappedRepositories.length > 0" class="flex items-center">
      <lf-github-mappings-display :mappings="mappedRepositories" />
      <span class="font-semibold">&nbsp;&nbsp;•&nbsp;&nbsp;</span>
      <!-- see integration-list-item.vue for last data check completed -->
      <span class="text-small text-gray-500">
        Last data check completed 1 hour ago
      </span>
    </div>

    <div v-for="org of orgs" :key="org.url" class="flex items-center gap-1">
      <lf-icon
        name="arrows-rotate"
        :size="16"
        class="text-gray-400 flex items-center"
      />
      <p class="text-gray-600 text-xs">
        Syncing GitHub data from <span class="font-semibold">{{ org.name }}</span> for
        <el-popover trigger="hover" placement="top" popper-class="!w-auto">
          <template #reference>
            <span class="underline decoration-dashed cursor-default">
              {{ pluralize('repository', remainingRepositories(org.url).length, true) }}
            </span>
          </template>

          <div v-if="remainingRepositories(org.url).length > 0" class="-my-1 px-1 max-h-44 overflow-auto">
            <article
              v-for="repo of remainingRepositories(org.url)"
              :key="repo.name"
              class="py-2 flex items-center flex-nowrap"
            >
              <lf-icon name="book" :size="16" class="text-gray-600 mr-2" />
              <a
                :href="repo.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs leading-5 max-w-3xs truncate hover:underline !text-black"
              >
                /{{ repo.name }}
              </a>
            </article>
          </div>
        </el-popover>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import pluralize from 'pluralize';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { IntegrationMapping } from '@/modules/admin/modules/integration/types/Integration';
import LfGithubMappingsDisplay from './github-mappings-display.vue';

const props = defineProps<{
  integration: any;
}>();

// const mockNango = {
//   test: {repoName: 'styled-components',}
// };

const mappings = ref<IntegrationMapping[]>([]);

const repoNameFromUrl = (url: string) => url.split('/').at(-1);
const remainingRepositories = (orgUrl: string) => {
  const orgRepos = props.integration.settings.orgs.find((o: any) => o.url === orgUrl)?.repos;

  if (!orgRepos) return [];

  return orgRepos.filter((repo: any) => !mappedRepositories.value.includes(repo.url));
};

const mappedRepositories = computed(() => {
  const reposObj = props.integration.settings.nangoMapping;

  const mapped = reposObj
    ? Object.values(reposObj).map((repo: any) => repo.repoName) || []
    : [];
  return mappings.value.filter((mapping) => mapped.includes(repoNameFromUrl(mapping.url)));
});

const orgs = computed(() => props.integration.settings.orgs);

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
