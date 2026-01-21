<template>
  <div class="flex items-center gap-1">
    <lf-icon
      name="arrows-rotate"
      :size="16"
      class="text-gray-400 mx-2 flex items-center"
    />
    <p class="text-gray-600 text-xs">
      Syncing GitHub data from <span class="font-semibold">{{ orgName }}</span> for 
      <el-popover trigger="hover" placement="top" popper-class="!w-auto">
        <template #reference>
          <span class="underline decoration-dashed cursor-default">
            {{ pluralize('repository', allRepositoriesNames.length, true) }}
          </span>
        </template>

        <div class="-my-1 px-1 max-h-44 overflow-auto" v-if="allRepositoriesNames.length > 0">
          <article
            v-for="repo of allRepositoriesNames"
            :key="repo.name"
            class="py-2 flex items-center flex-nowrap"
          >
            <lf-svg
              name="git-repository"
              class="w-4 h-4 mr-2 flex items-center"
            />
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

// TODO: verify if the status of mappedRepositories is available for github old integration
// const mappedRepositories = computed(() => {
//   const reposObj = props.integration.settings.nangoMapping;
//   const mapped = reposObj
//     ? Object.values(reposObj).map((repo: any) => repo.repoName) || []
//     : [];
//   return mappings.value.filter((mapping) => mapped.includes(repoNameFromUrl(mapping.url)));
// });

const allRepositoriesNames = computed(() => props.integration.settings.orgs
  .map((org: any) => org.repos.map((repo: any) => repo))
  .flat());
const orgName = computed(() => props.integration.settings.orgs.length > 0 ? props.integration.settings.orgs[0].name : 'blah');

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
  name: 'LfGithubIntegrationProgress',
};
</script>
