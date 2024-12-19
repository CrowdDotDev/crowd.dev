<template>
  <div class="flex items-center gap-4">
    <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--        <lf-icon name="circle-info" type="regular" />-->
    <!--        Details-->
    <!--      </lf-button>-->
    <lf-button type="secondary" @click="isStackoverflowConnectDrawerOpen = true">
      <lf-icon name="link-simple" />
      <slot>Connect</slot>
    </lf-button>
  </div>
  <lf-stackoverflow-settings-drawer
    v-if="isStackoverflowConnectDrawerOpen"
    v-model="isStackoverflowConnectDrawerOpen"
    :integration="props.integration"
    :segment-id="props.segmentId"
    :grandparent-id="props.grandparentId"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfStackoverflowSettingsDrawer
  from '@/config/integrations/stackoverflow/components/stackoverflow-settings-drawer.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
  segmentId: {
    type: String,
    required: true,
  },
  grandparentId: {
    type: String,
    required: true,
  },
});

const isStackoverflowConnectDrawerOpen = ref(false);
</script>

<script>
export default {
  name: 'LfStackOverflowConnect',
};
</script>
