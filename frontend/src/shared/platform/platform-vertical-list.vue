<template>
  <div
    v-for="([platform, value], ii) of Object.entries(platformHandlesLinks)"
    :key="platform"
  >
    <el-divider v-if="showDivider(platform, ii)" class="border-t-gray-200 !my-2" />

    <template
      v-for="({ handle, link }, vi) of value"
      :key="handle"
    >
      <component
        :is="link ? 'a' : 'span'"
        class="h-10 flex justify-between items-center relative group"
        :class="{
          'hover:bg-gray-50 transition-colors cursor-pointer': link,
          [`px-${xPadding}`]: !!xPadding,
        }"
        :href="link"
        target="_blank"
        rel="noopener noreferrer"
      >
        <el-tooltip
          placement="top"
          :content="handle"
          :visible="showTooltip[`${ii}${vi}`]"
          :disabled="!showTooltip[`${ii}${vi}`]"
        >
          <div
            class="flex gap-3 items-center overflow-hidden mr-2"
          >
            <app-platform
              :platform="platform"
              :as-link="false"
              size="large"
              app-module="member"
            />

            <div
              v-if="platform === 'linkedin' && handle.includes('private-')"
              class="text-gray-900 text-xs"
            >
              <span>*********</span>
              <el-tooltip placement="top" content="Private profile">
                <i class="ri-lock-line text-gray-400 ml-2" />
              </el-tooltip>
            </div>

            <span
              v-else
              :ref="(el) => setHandleRefs(el, `${ii}${vi}`)"
              class="text-gray-900 text-xs truncate leading-6 h-fit"
              @mouseover="(el) => handleOnMouseOver(`${ii}${vi}`)"
              @mouseleave="handleOnMouseLeave(`${ii}${vi}`)"
            >
              {{ handle }}
            </span>
          </div>
        </el-tooltip>
        <i
          v-if="link"
          class="ri-external-link-line text-gray-300"
        />
      </component>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppPlatform from '@/shared/platform/platform-icon/platform.vue';
import { reactive } from 'vue';

const props = defineProps<{
    platformHandlesLinks: {
      [key: string]: {
        handle: string;
        link: string;
      }[]
    };
    xPadding?: number;
    showIdentitiesDivider?: boolean;
}>();
const handleRef = reactive<Record<string, any>>({});
const showTooltip = reactive<Record<string, boolean>>({});

const setHandleRefs = (el: any, id: string) => {
  if (el) {
    handleRef[id] = el;
  }
};

const handleOnMouseOver = (index: string) => {
  if (!handleRef[index]) {
    showTooltip[index] = false;
  }

  showTooltip[index] = handleRef[index].scrollWidth > handleRef[index].clientWidth;
};

const handleOnMouseLeave = (index: string) => {
  showTooltip[index] = false;
};

const showDivider = (platform: string, index: number) => {
  if (props.showIdentitiesDivider && ((platform === 'emails' && index !== 0)
    || (platform === 'phoneNumbers'
      && index !== 0
        && Object.keys(props.platformHandlesLinks)[index - 1] !== 'emails'
    ))) {
    return true;
  }

  return false;
};
</script>

<script lang="ts">
export default {
  name: 'AppPlatformVerticalListMember',
};
</script>
