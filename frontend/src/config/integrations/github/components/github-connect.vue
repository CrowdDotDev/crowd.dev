<template>
  <div>
    <div class="flex items-center gap-4">
      <!--      <lf-button type="secondary-ghost" class="!text-gray-500" @click="isDetailsModalOpen = true">-->
      <!--        <lf-icon name="circle-info" type="regular" />-->
      <!--        Details-->
      <!--      </lf-button>-->
      <lf-button type="secondary" @click="isSettingsDrawerOpen = true">
        <lf-icon name="link-simple" />
        Connect
      </lf-button>
    </div>
    <lf-github-settings-drawer v-if="isSettingsDrawerOpen" v-model="isSettingsDrawerOpen" :integration="null" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGithubSettingsDrawer from '@/config/integrations/github/components/settings/github-settings-drawer.vue';

const isSettingsDrawerOpen = ref(true);
</script>

<script lang="ts">
export default {
  name: 'LfGithubConnect',
};
</script>
