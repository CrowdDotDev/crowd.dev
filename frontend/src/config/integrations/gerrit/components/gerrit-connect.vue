<template>
  <div class="flex items-center gap-4">
    <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--        <lf-icon name="circle-info" type="regular" />-->
    <!--        Details-->
    <!--      </lf-button>-->
    <lf-button type="secondary" @click="isGerritConnectDrawerOpen = true">
      <lf-icon name="link-simple" />
      Connect
    </lf-button>
  </div>
  <lf-gerrit-settings-drawer
    v-if="isGerritConnectDrawerOpen"
    v-model="isGerritConnectDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfGerritSettingsDrawer from '@/config/integrations/gerrit/components/gerrit-settings-drawer.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isGerritConnectDrawerOpen = ref(false);
</script>

<script>
export default {
  name: 'LfGerritConnect',
};
</script>
