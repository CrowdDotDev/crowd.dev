<template>
  <div class="flex items-center gap-1">
    <el-popover trigger="hover" placement="top" popper-class="!w-auto">
      <template #reference>
        <div v-if="!isInProgress" class="text-gray-600 text-2xs flex items-center leading-5">
          <lf-svg
            name="git-repository"
            class="w-4 h-4 !text-gray-600 mr-1 flex items-center"
          />
          <span class="font-semibold">
            {{ pluralize('repository', Object.keys(mappings).length, true) }}
          </span>
        </div>
        <span v-else class="text-gray-600 text-2xs flex items-center leading-5 font-semibold">
          {{ mappedRepositories.length }} out of
          {{ allRepositoriesNames.length }} repositories connected
        </span>
      </template>

      <p class="text-gray-400 text-sm font-semibold mb-4">
        {{ isInProgress ? 'Connected GitHub repositories' : 'GitHub repositories' }}
      </p>
      <div class="-my-1 px-1 max-h-44 overflow-auto">
        <article
          v-for="mapping of mappedRepositories"
          :key="mapping.url"
          class="py-2 flex items-center flex-nowrap"
        >
          <lf-svg
            name="git-repository"
            class="w-4 h-4 mr-2 flex items-center"
          />
          <a
            :href="mapping.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs leading-5 max-w-3xs truncate hover:underline !text-black"
          >
            /{{ repoNameFromUrl(mapping.url) }}
          </a>
          <lf-icon
            name="arrow-right"
            :size="16"
            class="text-gray-400 mx-2 flex items-center"
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
import { computed, onMounted, ref } from 'vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import pluralize from 'pluralize';
import LfSvg from '@/shared/svg/svg.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = defineProps<{
  integration: any;
}>();

const mappings = ref<
  {
    url: string;
    segment: {
      id: string;
      name: string;
    };
  }[]
>([]);

const repoNameFromUrl = (url: string) => url.split('/').at(-1);

const mappedRepositories = computed(() => {
  const reposObj = props.integration.settings.nangoMapping;
  const mapped = reposObj
    ? Object.values(reposObj).map((repo: any) => repo.repoName) || []
    : [];
  return mappings.value.filter((mapping) => mapped.includes(repoNameFromUrl(mapping.url)));
});

const allRepositoriesNames = computed(() => props.integration.settings.orgs
  .map((org: any) => org.repos.map((repo: any) => repo.name))
  .flat());

const isInProgress = computed(() => mappedRepositories.value.length < allRepositoriesNames.value.length);
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
  name: 'LfGithubParams',
};
</script>
