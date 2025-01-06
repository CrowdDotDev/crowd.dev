<template>
  <lf-dropdown-item @click="isTwitterConnectDrawerOpen = true">
    <lf-icon name="sliders-simple" type="regular" />
    Settings
  </lf-dropdown-item>
  <lf-twitter-settings-drawer
    v-if="isTwitterConnectDrawerOpen"
    v-model="isTwitterConnectDrawerOpen"
    :hashtags="hashtags"
    :connect-url="connectUrl"
  />
</template>

<script setup lang="ts">
import { computed, defineProps, ref } from 'vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfTwitterSettingsDrawer from '@/config/integrations/twitter/components/twitter-settings-drawer.vue';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import config from '@/config';
import { AuthService } from '@/modules/auth/services/auth.service';

const props = defineProps<{
  integration: any;
  grandparentId: string | null;
  segmentId: string | null;
}>();

const isTwitterConnectDrawerOpen = ref(false);

const hashtags = computed(() => props.integration.settings?.hashtags || []);

const connectUrl = computed(() => {
  const redirectUrl = props.grandparentId && props.segmentId
    ? `${window.location.protocol}//${window.location.host}/integrations/${props.grandparentId}/${props.segmentId}?success=true`
    : `${window.location.protocol}//${window.location.host}${window.location.pathname}?success=true`;

  const authStore = useAuthStore();
  const { tenant } = storeToRefs(authStore);

  return `${config.backendUrl}/twitter/${
    tenant.value.id
  }/connect?redirectUrl=${redirectUrl}&crowdToken=${AuthService.getToken()}&segments[]=${
    props.segmentId
  }`;
});
</script>

<script lang="ts">
export default {
  name: 'LfGitDropdown',
};
</script>
