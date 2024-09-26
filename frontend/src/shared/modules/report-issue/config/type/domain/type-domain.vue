<template>
  <p class="text-medium">
    {{ props.attribute.value }}
  </p>
</template>

<script setup lang="ts">
import { ContributorIdentity } from '@/modules/contributor/types/Contributor';
import { OrganizationIdentity } from '@/modules/organization/types/Organization';

const props = defineProps<{
  attribute: ContributorIdentity | OrganizationIdentity
}>();
</script>
