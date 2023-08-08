<template>
  <component
    :is="asLink ? 'a' : 'span'"
    v-for="username of usernameHandles"
    :key="username"
    class="px-4 py-2 flex justify-between items-center relative group"
    :class="{
      'hover:bg-gray-50 transition-colors cursor-pointer': asLink && getPlatformUrl({ platform, username }),
    }"
    :href="getPlatformUrl({ platform, username })"
    target="_blank"
    rel="noopener noreferrer"
  >
    <div class="flex gap-3 items-center">
      <app-platform :platform="platform" :show-tooltip="true" />
      <div
        v-if="
          platform === 'linkedin'
            && username.includes(
              'private-',
            )
        "
        class="text-gray-900 text-xs"
      >
        *********
        <el-tooltip
          placement="top"
          content="Private profile"
        >
          <i
            class="ri-lock-line text-gray-400 ml-2"
          />
        </el-tooltip>
      </div>
      <span v-else class="text-gray-900 text-xs">
        {{ username }}</span>
    </div>
    <i
      v-if="asLink && getPlatformUrl({ platform, username })"
      class="ri-external-link-line text-gray-300 invisible group-hover:visible"
    />
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps({
  usernameHandles: {
    type: Array,
    default: () => [],
  },
  platform: {
    type: String,
    default: null,
  },
  url: {
    type: String,
    default: null,
  },
});

const asLink = computed(() => CrowdIntegrations.getConfig(props.platform)?.showProfileLink);
const getPlatformUrl = ({ platform, username }) => {
  const url = CrowdIntegrations.getConfig(platform)?.url(username);
  return url ?? props.url;
};
</script>

<script>
export default {
  name: 'AppPlatformList',
};
</script>
