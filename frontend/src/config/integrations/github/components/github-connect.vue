<template>
  <div>
    <div class="flex items-center gap-4">
      <!--      <lf-button v-if="!props.hideDetails" type="secondary-ghost" class="!text-gray-500" @click="isDetailsModalOpen = true">-->
      <!--        <lf-icon name="circle-info" type="regular" />-->
      <!--        Details-->
      <!--      </lf-button>-->
      <lf-button type="secondary" @click="isSettingsDrawerOpen = true">
        <lf-icon name="link-simple" />
        <slot>Connect</slot>
      </lf-button>
    </div>
    <lf-github-settings-drawer
      v-if="isSettingsDrawerOpen"
      v-model="isSettingsDrawerOpen"
      :integration="props.integration"
      :segment-id="props.segmentId"
      :grandparent-id="props.grandparentId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGithubSettingsDrawer from '@/config/integrations/github/components/settings/github-settings-drawer.vue';

const props = defineProps<{
  integration: any,
  segmentId: string | null;
  grandparentId: string | null;
}>();

const isSettingsDrawerOpen = ref(false);
</script>

<script lang="ts">
export default {
  name: 'LfGithubConnect',
};
</script>
