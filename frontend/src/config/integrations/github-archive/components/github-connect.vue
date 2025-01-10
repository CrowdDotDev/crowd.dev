<template>
  <div>
    <div class="flex items-center gap-4">
      <!--      <lf-button v-if="!props.hideDetails" type="secondary-ghost" class="!text-gray-500" @click="isDetailsModalOpen = true">-->
      <!--        <lf-icon name="circle-info" type="regular" />-->
      <!--        Details-->
      <!--      </lf-button>-->
      <el-tooltip
        content="Onboarding new data for GitHub is currently being
        managed by the CM dev team. Please reach out in Slack (#lfx-cm) to get your project onboarded."
        placement="top"
        :disabled="isTeam"
      >
        <lf-button type="secondary" :disabled="!isTeam" @click="isSettingsDrawerOpen = true">
          <lf-icon name="link-simple" />
          <slot>Connect</slot>
        </lf-button>
      </el-tooltip>
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
import { ref, computed } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGithubSettingsDrawer from '@/config/integrations/github-archive/components/settings/github-settings-drawer.vue';
import { isTeamUser } from '@/config/permissions';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

const props = defineProps<{
  integration: any,
  segmentId: string | null;
  grandparentId: string | null;
}>();

const isSettingsDrawerOpen = ref(false);

const { user } = storeToRefs(useAuthStore());

const isTeam = computed(() => isTeamUser(user.value));
</script>

<script lang="ts">
export default {
  name: 'LfGithubConnect',
};
</script>
