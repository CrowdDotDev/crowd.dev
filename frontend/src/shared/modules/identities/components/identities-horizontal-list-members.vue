<template>
  <app-identities-horizontal-list
    :identities="identities.getIdentities()"
    :limit="limit"
    :as-svg="asSvg"
  />
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import useMemberIdentities from '@/shared/modules/identities/config/useMemberIdentities';
import memberOrder from '@/shared/modules/identities/config/identitiesOrder/member';
import { Member } from '@/modules/member/types/Member';
import AppIdentitiesHorizontalList from '@/shared/modules/identities/components/identities-horizontal-list.vue';

const props = defineProps<{
  member: Member;
  limit?: number;
  asSvg?: boolean;
}>();

const identities = computed(() => useMemberIdentities({
  member: props.member,
  order: memberOrder.list,
}));
</script>

<script lang="ts">
export default {
  name: 'AppIdentitiesHorizontalListMembers',
};
</script>
