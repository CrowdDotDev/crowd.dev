<template>
  <el-popover
    v-if="platformHandlesLinks.length > 1"
    placement="top"
    popper-class="!px-0 !py-4 !shadow !rounded-lg"
    width="20rem"
    trigger="hover"
  >
    <template #reference>
      <div>
        <slot name="platform" />
      </div>
    </template>
    <div class="overflow-y-auto overflow-x-hidden max-h-72">
      <div class="text-xs text-gray-400 font-semibold mb-3 px-5">
        Identities
      </div>
      <app-platform-vertical-list
        :platform-handles-links="{ [platform]: platformHandlesLinks }"
        :platform="platform"
        :x-padding="5"
      />
    </div>
  </el-popover>
  <el-tooltip
    v-else
    popper-class="custom-identity-tooltip"
    placement="top"
  >
    <template #content>
      <span>{{ platformName }}
        <span v-if="asLink">
          profile
          <i
            class="ri-external-link-line text-gray-400"
          /></span>
      </span>
    </template>

    <slot name="platform" />
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppPlatformVerticalList from '@/shared/platform/platform-vertical-list.vue';

const props = defineProps<{
    platformHandlesLinks: {
      handle: string;
      link: string;
    }[];
    platform: string;
}>();

const platformConfig = computed(() => CrowdIntegrations.getConfig(props.platform) || {});
const asLink = computed(() => platformConfig.value.showProfileLink);
const platformName = computed(() => {
  if (props.platform === 'emails') {
    return 'Email';
  }

  if (props.platform === 'phoneNumbers') {
    return 'Phone number';
  }

  return platformConfig.value.name || props.platform;
});
</script>

<script lang="ts">
export default {
  name: 'AppPlatformListPopover',
};
</script>
