<template>
  <div v-if="hasIdentities" class="flex items-center gap-3">
    <div class="flex gap-3 items-center">
      <div
        v-for="[platform, value] of Object.entries(slicedUsername.visible)"
        :key="platform"
      >
        <app-platform
          v-if="value.length"
          :platform="platform"
          :platform-handles-links="value"
        />
      </div>
      <div v-if="slicedUsername.hiddenLength">
        <el-popover
          trigger="hover"
          placement="top"
          width="20rem"
          popper-class="!px-0 !py-4 !shadow !rounded-lg"
        >
          <template #reference>
            <div
              class="text-gray-500 text-xs font-medium px-1.5 h-6 leading-6 border border-gray-200 rounded-md"
            >
              +{{ slicedUsername.hiddenLength }}
            </div>
          </template>

          <div class="overflow-y-auto overflow-x-hidden max-h-72">
            <div class="text-xs text-gray-400 font-semibold mb-3 px-5">
              Identities
            </div>
            <app-platform-vertical-list
              :platform-handles-links="slicedUsername.hidden"
              :x-padding="5"
            />
          </div>
        </el-popover>
      </div>
    </div>
  </div>
  <div v-else class="text-gray-500">
    -
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import useMemberIdentities from '@/utils/identities/useMemberIdentities';
import AppPlatform from '@/shared/platform/platform-icon/platform.vue';
import AppPlatformVerticalList from '@/shared/platform/platform-vertical-list.vue';
import { Member } from '@/modules/member/types/Member';
import platformOrders from '@/shared/platform/config/order/member';

const props = defineProps<{
  member: Member;
  limit?: number;
}>();

const identities = computed(() => useMemberIdentities({
  member: props.member,
  order: platformOrders.listOrder,
}));

const slicedUsername = computed(() => {
  const parsedIdentities = identities.value.getOrderedPlatformHandlesAndLinks();
  const usernameKeys = Object.keys(parsedIdentities);
  const hiddenKeys = Object.keys(parsedIdentities).slice(
    props.limit ?? usernameKeys.length,
  );
  const visibleKeys = Object.keys(parsedIdentities).slice(
    0,
    props.limit ?? usernameKeys.length,
  );

  const visible = visibleKeys.reduce(
    (
      acc: {
          [key: string]: {
            handle: string;
            link: string;
          }[];
        },
      k,
    ) => {
      acc[k] = parsedIdentities[k];

      return acc;
    },
    {},
  );

  const hidden = hiddenKeys.reduce(
    (
      acc: {
          [key: string]: {
            handle: string;
            link: string;
          }[];
        },
      k,
    ) => {
      acc[k] = parsedIdentities[k];

      return acc;
    },
    {},
  );

  return {
    visible,
    hidden,
    hiddenLength: hiddenKeys.reduce(
      (acc, p) => acc + hidden[p].length,
      0,
    ),
  };
});

const hasIdentities = computed(() => Object.keys(identities.value.getOrderedPlatformHandlesAndLinks()).length);
</script>

<script lang="ts">
export default {
  name: 'AppPlatformHorizontalListMember',
};
</script>
