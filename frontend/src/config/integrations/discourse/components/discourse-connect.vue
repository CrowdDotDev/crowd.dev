<template>
  <div class="flex items-center gap-4">
    <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--        <lf-icon name="circle-info" type="regular" />-->
    <!--        Details-->
    <!--      </lf-button>-->
    <lf-button type="secondary" @click="isDiscourseConnectDrawerOpen = true">
      <lf-icon name="link-simple" />
      Connect
    </lf-button>
  </div>
  <lf-discourse-settings-drawer
    v-if="isDiscourseConnectDrawerOpen"
    v-model="isDiscourseConnectDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfDiscourseSettingsDrawer from '@/config/integrations/discourse/components/discourse-settings-drawer.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isDiscourseConnectDrawerOpen = ref(false);
</script>

<script>
export default {
  name: 'AppDiscourseConnect',
};
</script>
