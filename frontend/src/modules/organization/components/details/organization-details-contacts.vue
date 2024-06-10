<template>
  Contacts
</template>

<script setup lang="ts">
import { Organization } from '@/modules/organization/types/Organization';

const props = defineProps<{
  organization: Organization,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationDetailsContacts',
};
</script>
