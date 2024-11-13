<template>
  <lf-button v-if="isMapping" type="secondary" @click="isSettingsDrawerOpen = true">
    Map repositories
  </lf-button>
  <app-gitlab-settings-drawer
    v-if="isSettingsDrawerOpen"
    v-model="isSettingsDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { computed, ref } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import AppGitlabSettingsDrawer from './gitlab-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isMapping = computed(() => props.integration.status === 'mapping');

const isSettingsDrawerOpen = ref(isMapping.value);
</script>

<script>
export default {
  name: 'AppGitlabAction',
};
</script>
