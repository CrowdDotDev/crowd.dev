<template>
  <div>
    <el-button
      v-if="props.integration?.status === 'mapping'"
      class="btn btn-link btn-link--md btn-link--primary"
      @click="settingsDrawerOpen = true"
    >
      <i class="ri-settings-2-line mr-2" />Settings
    </el-button>
    <el-popover v-else trigger="hover" placement="top" popper-class="!w-auto">
      <template #reference>
        <div

          class="text-gray-500 text-2xs flex items-center leading-4"
        >
          <i class="ri-git-repository-line text-base !text-gray-400 mr-1 h-4 flex items-center" />
          {{ Object.keys(mappings).length }} {{ Object.keys(mappings).length !== 1 ? 'repositories' : 'repository' }}
        </div>
      </template>

      <div class="-my-1 px-1 max-h-44 overflow-auto">
        <article v-for="mapping of mappings" :key="mapping.url" class="py-2 flex items-center flex-nowrap">
          <div class="ri-git-repository-line text-base mr-2 h-4 flex items-center" />
          <div class="text-xs leading-5 max-w-3xs truncate">
            /{{ repoNameFromUrl(mapping.url) }}
          </div>
          <div class="ri-arrow-right-line text-gray-400 text-base mx-2 h-4 flex items-center" />
          <div class="text-xs leading-5 max-w-3xs truncate">
            {{ mapping.segment.name }}
          </div>
        </article>
      </div>
    </el-popover>
  </div>
  <app-github-settings-drawer v-if="settingsDrawerOpen" v-model="settingsDrawerOpen" :integration="props.integration" />
</template>

<script setup>
import { onMounted, ref } from 'vue';
import AppGithubSettingsDrawer from '@/integrations/github/components/github-settings-drawer.vue';
import { IntegrationService } from '@/modules/integration/integration-service';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const settingsDrawerOpen = ref(props.integration.status === 'mapping');

const mappings = ref([]);

const repoNameFromUrl = (url) => url.split('/').at(-1);

onMounted(() => {
  if (props.integration.status !== 'mapping') {
    IntegrationService.fetchGitHubMappings(props.integration)
      .then((res) => {
        mappings.value = res;
      });
  }
});

</script>

<script>
export default {
  name: 'AppGithubSettings',
};
</script>
