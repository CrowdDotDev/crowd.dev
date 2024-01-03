<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-1">
      <div class="font-medium text-black">
        Identities
      </div>
      <el-tooltip placement="top">
        <template #content>
          Identities can be profiles on social platforms, emails,<br>
          or unique identifiers from internal sources.
        </template>
        <span>
          <i class="ri-information-line text-xs" />
        </span>
      </el-tooltip>
    </div>
  </div>
  <div class="-mx-6 mt-6">
    <app-platform-vertical-list
      :platform-handles-links="identities.getOrderedPlatformHandlesAndLinks()"
      :x-padding="6"
      :show-identities-divider="true"
    />

    <div
      v-if="noIdentities"
      class="text-sm text-gray-600 px-6 pt-2"
    >
      <router-link
        :to="{
          name: 'organizationEdit',
          params: { id: organization.id },
        }"
      >
        Add identities
      </router-link>
    </div>
  </div>
</template>

<script setup>
import {
  computed, defineProps,
} from 'vue';
import AppPlatformVerticalList from '@/shared/platform/platform-vertical-list.vue';
import useOrganizationIdentities from '@/utils/identities/useOrganizationIdentities';
import organizationOrder from '@/shared/platform/config/order/organization';

const props = defineProps({
  organization: {
    type: Object,
    default: () => {},
  },
});

const noIdentities = computed(() => (
  !props.organization.github?.url
    && !props.organization.linkedin?.url
    && !props.organization.twitter?.url
    && !props.organization.crunchbase?.url
    && !props.organization.facebook?.url
    && (!props.organization.emails
      || props.organization.emails.length === 0)
    && (!props.organization.phoneNumbers
      || props.organization.phoneNumbers.length === 0)
));

const identities = computed(() => useOrganizationIdentities({
  organization: props.organization,
  order: organizationOrder.profileOrder,
}));
</script>
