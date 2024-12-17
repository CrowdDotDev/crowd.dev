<template>
  <div class="flex items-center gap-4">
    <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--        <lf-icon name="circle-info" type="regular" />-->
    <!--        Details-->
    <!--      </lf-button>-->
    <lf-button type="secondary" @click="isHackernewsSettingsDrawerOpen = true">
      <lf-icon name="link-simple" />
      <slot>Connect</slot>
    </lf-button>
  </div>
  <lf-hackernews-settings-drawer
    v-if="isHackernewsSettingsDrawerOpen"
    v-model="isHackernewsSettingsDrawerOpen"
    :integration="props.integration"
  />
</template>

<script setup>
import { defineProps, ref } from 'vue';
import LfHackernewsSettingsDrawer from '@/config/integrations/hackernews/components/hackernews-settings-drawer.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  integration: {
    type: Object,
    default: () => {},
  },
});

const isHackernewsSettingsDrawerOpen = ref(false);

</script>

<script>
export default {
  name: 'AppHackerNewsConnect',
};
</script>
