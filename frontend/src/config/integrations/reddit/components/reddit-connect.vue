<template>
  <div class="flex items-center gap-4">
    <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--        <lf-icon name="circle-info" type="regular" />-->
    <!--        Details-->
    <!--      </lf-button>-->
    <lf-button type="secondary" @click="isRedditSettingsDrawerOpen = true">
      <lf-icon name="link-simple" />
      Connect
    </lf-button>
  </div>
  <lf-reddit-settings-drawer
    v-if="isRedditSettingsDrawerOpen"
    v-model="isRedditSettingsDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfRedditSettingsDrawer from '@/config/integrations/reddit/components/reddit-settings-drawer.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});
const isRedditSettingsDrawerOpen = ref(false);
</script>

<script>
export default {
  name: 'AppRedditConnect',
};
</script>
