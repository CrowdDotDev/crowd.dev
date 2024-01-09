<template>
  <div class="flex flex-col gap-5">
    <div
      v-for="[platform, value] of Object.entries(slicedIdentities)"
      :key="platform"
    >
      <div v-if="value.length">
        <div
          class="flex gap-3 items-start relative min-h-5"
          :class="{
            [`px-${xPadding}`]: !!xPadding,
          }"
        >
          <app-platform
            :platform="platform"
            :as-link="false"
            size="large"
            :show-platform-tooltip="true"
          />

          <div class="flex flex-wrap items-center gap-2 w-full">
            <div class="inline-block overflow-wrap items-center w-full pr-8">
              <template v-for="({ handle, link }, vi) of value" :key="handle">
                <div
                  v-if="platform === 'linkedin' && handle.includes('private-')"
                  class="text-gray-900 text-xs"
                >
                  <span>*********</span>
                  <el-tooltip placement="top" content="Private profile">
                    <i class="ri-lock-line text-gray-400" />
                  </el-tooltip>
                </div>

                <component
                  :is="link ? 'a' : 'span'"
                  v-else
                  :href="link"
                  class="text-gray-900 text-xs font-medium leading-5 items-center w-auto break-words"
                  :class="{
                    'underline decoration-dashed decoration-gray-400 underline-offset-4 ':
                      link,
                    'hover:decoration-gray-900 hover:cursor-pointer hover:!text-gray-900':
                      link,
                  }"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ handle }}
                </component>

                <span
                  v-if="vi !== value.length - 1"
                  class="font-medium"
                >・</span>
              </template>
            </div>
            <span
              v-if="isCustomPlatform(platform)"
              class="text-xs text-gray-400"
            >{{ platform }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="displayShowMore && Object.keys(identities).length > 5"
      class="underline cursor-pointer text-gray-500 hover:text-brand-500 text-xs underline-offset-4"
      :class="{
        [`px-${xPadding}`]: !!xPadding,
      }"
      @click="displayMore = !displayMore"
    >
      Show {{ displayMore ? "less" : "more" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPlatform from '@/shared/modules/platform/components/platform.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { computed, ref } from 'vue';
import { Platform } from '@/shared/modules/platform/types/Platform';

const props = defineProps<{
  identities: {
    [key: string]: {
      handle: string;
      link: string;
    }[];
  };
  xPadding?: number;
  displayShowMore?: boolean;
}>();

const displayMore = ref(false);

const slicedIdentities = computed(() => {
  if (!displayMore.value && props.displayShowMore) {
    return Object.fromEntries(Object.entries(props.identities).slice(0, 5));
  }

  return props.identities;
});

const isCustomPlatform = (platform: string) => platform !== Platform.EMAILS
  && platform !== Platform.PHONE_NUMBERS
  && !CrowdIntegrations.getConfig(platform)?.name;
</script>

<script lang="ts">
export default {
  name: 'AppIdentitiesVerticalList',
};
</script>
