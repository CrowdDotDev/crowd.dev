<template>
  <div>
    <el-button
      v-if="props.integration?.status === 'mapping'"
      class="btn btn-link btn-link--md btn-link--primary"
      @click="settingsDrawerOpen = true"
    >
      <i class="ri-settings-2-line mr-2" />Settings
    </el-button>
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
