<template>
  <app-identities-vertical-list
    :identities="{
      ...identities.getIdentities(),
      ...(includeEmails ? { emails: identities.getEmails() } : {}),
    }"
    :x-padding="xPadding"
    :display-show-more="displayShowMore"
  />

  <slot :identities="identities" />
</template>

<script setup lang="ts">
import { Member } from '@/modules/member/types/Member';
import useMemberIdentities from '@/shared/modules/identities/config/useMemberIdentities';
import AppIdentitiesVerticalList from '@/shared/modules/identities/components/identities-vertical-list.vue';
import { computed } from 'vue';
import { Platform } from '@/shared/modules/platform/types/Platform';

const props = defineProps<{
  member: Member;
  xPadding?: number;
  displayShowMore?: boolean;
  includeEmails?: boolean;
  order: Platform[]
}>();

const identities = computed(() => useMemberIdentities({
  member: props.member,
  order: props.order,
}));
</script>

<script lang="ts">
export default {
  name: 'AppIdentitiesVerticalListMembers',
};
</script>
