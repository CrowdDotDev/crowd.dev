<template>
  <div class="flex items-center gap-4">
    <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--        <lf-icon name="circle-info" type="regular" />-->
    <!--        Details-->
    <!--      </lf-button>-->
    <lf-button type="secondary" @click="isConfluenceSettingsDrawerVisible = true">
      <lf-icon name="link-simple" />
      Connect
    </lf-button>
  </div>
  <lf-confluence-settings-drawer
    v-if="isConfluenceSettingsDrawerVisible"
    v-model="isConfluenceSettingsDrawerVisible"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfConfluenceSettingsDrawer from '@/config/integrations/confluence/components/confluence-settings-drawer.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isConfluenceSettingsDrawerVisible = ref(false);
</script>

<script>
export default {
  name: 'LfConfluenceConnect',
};
</script>
