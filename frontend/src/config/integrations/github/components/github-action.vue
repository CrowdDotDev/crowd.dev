<template>
  <lf-button v-if="isMapping" type="secondary" @click="isSettingsDrawerOpen = true">
    Map repositories
  </lf-button>
  <app-github-settings-drawer
    v-if="isSettingsDrawerOpen"
    v-model="isSettingsDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppGithubSettingsDrawer from '@/integrations/github/components/github-settings-drawer.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps<{
  integration: any;
}>();

const isMapping = computed(() => props.integration.status === 'mapping');

const isSettingsDrawerOpen = ref(props.integration.status === 'mapping');
</script>

<script lang="ts">
export default {
  name: 'LfGithubAction',
};
</script>
