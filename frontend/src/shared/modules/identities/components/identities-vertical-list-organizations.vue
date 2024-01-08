<template>
  <app-identities-vertical-list
    :identities="{
      ...identities.getIdentities(),
      ...(includeEmails ? { emails: identities.getEmails() } : {}),
      ...(includePhoneNumbers ? { phoneNumbers: identities.getPhoneNumbers() } : {}),
    }"
    :x-padding="xPadding"
    :display-show-more="displayShowMore"
  />

  <slot :identities="identities" />
</template>

<script setup lang="ts">
import useOrganizationIdentities from '@/shared/modules/identities/config/useOrganizationIdentities';
import AppIdentitiesVerticalList from '@/shared/modules/identities/components/identities-vertical-list.vue';
import { computed } from 'vue';
import { Platform } from '@/shared/modules/platform/types/Platform';
import { Organization } from '@/modules/organization/types/Organization';

const props = defineProps<{
  organization: Organization;
  order: Platform[]
  xPadding?: number;
  displayShowMore?: boolean;
  includeEmails?: boolean;
  includePhoneNumbers?: boolean;
}>();

const identities = computed(() => useOrganizationIdentities({
  organization: props.organization,
  order: props.order,
}));
</script>

<script lang="ts">
export default {
  name: 'AppIdentitiesVerticalListOrganizations',
};
</script>
