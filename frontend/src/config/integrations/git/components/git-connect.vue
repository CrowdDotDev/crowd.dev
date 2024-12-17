<template>
  <div>
    <div class="flex items-center gap-4">
      <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
      <!--        <lf-icon name="circle-info" type="regular" />-->
      <!--        Details-->
      <!--      </lf-button>-->
      <lf-button type="secondary" @click="isGitConnectDrawerVisible = true">
        <lf-icon name="link-simple" />
        <slot>Connect</slot>
      </lf-button>
    </div>
    <lf-git-settings-drawer
      v-model="isGitConnectDrawerVisible"
      :integration="props.integration"
    />
  </div>
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfGitSettingsDrawer from '@/config/integrations/git/components/git-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isGitConnectDrawerVisible = ref(false);
// const isDetailsModalOpen = ref(false);
</script>

<script>
export default {
  name: 'AppGitConnect',
};
</script>
