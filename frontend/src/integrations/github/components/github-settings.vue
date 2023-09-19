<template>
  <div>
    <el-button
      v-if="props.integration?.status !== 'mapping'"
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
          <i class="ri-git-repository-line text-base !text-gray-400 mr-1 h-4 flex items-center" />3 repositories
        </div>
      </template>

      <div class="-my-1 px-1">
        <article class="py-2 flex items-center flex-nowrap">
          <div class="ri-git-repository-line text-base mr-2 h-4 flex items-center" />
          <div class="text-xs leading-5 whitespace-nowrap">
            /analyzemyrepo
          </div>
          <div class="ri-arrow-right-line text-gray-400 text-base mx-2 h-4 flex items-center" />
          <div class="text-xs leading-5 whitespace-nowrap">
            {sub-project-name}
          </div>
        </article>
        <article class="py-2 flex items-center flex-nowrap">
          <div class="ri-git-repository-line text-base mr-2 h-4 flex items-center" />
          <div class="text-xs leading-5 whitespace-nowrap">
            /sth
          </div>
          <div class="ri-arrow-right-line text-gray-400 text-base mx-2 h-4 flex items-center" />
          <div class="text-xs leading-5 whitespace-nowrap">
            {sub-project-name}
          </div>
        </article>
        <article class="py-2 flex items-center flex-nowrap">
          <div class="ri-git-repository-line text-base mr-2 h-4 flex items-center" />
          <div class="text-xs leading-5 whitespace-nowrap">
            /analyzemyrepo
          </div>
          <div class="ri-arrow-right-line text-gray-400 text-base mx-2 h-4 flex items-center" />
          <div class="text-xs leading-5 whitespace-nowrap">
            {sub-project-name}
          </div>
        </article>
      </div>
    </el-popover>
  </div>
  <app-github-settings-drawer v-model="settingsDrawerOpen" :integration="props.integration" />
</template>

<script setup>
import { ref } from 'vue';
import AppGithubSettingsDrawer from '@/integrations/github/components/github-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const settingsDrawerOpen = ref(true);
</script>

<script>
export default {
  name: 'AppGithubSettings',
};
</script>
