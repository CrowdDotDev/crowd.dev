<template>
  <el-popover
    v-if="hasIdentities"
    trigger="hover"
    placement="top"
    width="20rem"
    popper-class="!px-0 !py-4 !shadow !rounded-lg"
  >
    <template #reference>
      <div class="flex gap-3 items-center bg-white border border-gray-200 hover:bg-gray-50 rounded-full h-8 px-3 relative cursor-auto group">
        <div class="text-xs text-gray-500 font-medium">
          {{ pluralize('identity', parsedIdentities.identitiesLength, true) }}
        </div>
        <div
          v-for="[platform, value] of Object.entries(parsedIdentities.visible)"
          :key="platform"
        >
          <app-platform
            v-if="value.length"
            :platform="platform"
            :platform-handles-links="value"
            :as-svg="asSvg"
            app-module="organization"
          />
        </div>
        <div
          v-if="parsedIdentities.platformsLength >= (limit || parsedIdentities.platformsLength)"
          class="absolute right-2.5 w-10 h-5 bg-gradient-to-r from-transparent to-white group-hover:to-gray-50"
        />
      </div>
    </template>

    <div class="overflow-y-auto overflow-x-hidden max-h-72">
      <div class="text-xs text-gray-400 font-semibold mb-3 px-5">
        Identities
      </div>
      <app-platform-vertical-list
        :platform-handles-links="identities.getIdentities()"
        :x-padding="5"
      />
    </div>
  </el-popover>
  <div v-else class="text-gray-500">
    -
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import AppPlatform from '@/shared/platform/platform-icon/platform.vue';
import useOrganizationIdentities from '@/utils/identities/useOrganizationIdentities';
import useMemberIdentities from '@/utils/identities/useMemberIdentities';
import organizationOrder from '@/shared/platform/config/order/organization';
import memberOrder from '@/shared/platform/config/order/member';
import { Organization } from '@/modules/organization/types/Organization';
import { Member } from '@/modules/member/types/Member';
import AppPlatformVerticalList from '@/shared/platform/platform-vertical-list.vue';
import pluralize from 'pluralize';

const props = defineProps<{
  organization?: Organization;
  member?: Member;
  limit?: number;
  asSvg?: boolean;
}>();

const identities = computed(() => {
  if (props.organization) {
    return useOrganizationIdentities({
      organization: props.organization,
      order: organizationOrder.listOrder,
    });
  }

  if (props.member) {
    return useMemberIdentities({
      member: props.member,
      order: memberOrder.listOrder,
    });
  }

  return {};
});

const parsedIdentities = computed(() => {
  const identitiesCopy = { ...identities.value.getIdentities() };
  const platformKeys = Object.keys(identitiesCopy);
  const visibleKeys = Object.keys(identitiesCopy).slice(
    0,
    props.limit ?? platformKeys.length,
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
      acc[k] = identitiesCopy[k];

      return acc;
    },
    {},
  );

  return {
    visible,
    platformsLength: platformKeys.length,
    identitiesLength: platformKeys.reduce(
      (acc, p) => acc + identitiesCopy[p].length,
      0,
    ),
  };
});

const hasIdentities = computed(() => Object.keys(identities.value.getIdentities()).length);
</script>

<script lang="ts">
export default {
  name: 'AppPlatformHorizontalList',
};
</script>
