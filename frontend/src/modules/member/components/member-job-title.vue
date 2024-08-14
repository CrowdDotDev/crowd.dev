<template>
  <div
    v-if="activeOrganization?.memberOrganizations?.title || member.attributes?.jobTitle?.default"
    class="flex items-start grow mt-2"
  >
    <span class="text-sm text-gray-900 line-clamp-2">
      {{ activeOrganization?.memberOrganizations?.title || member.attributes?.jobTitle?.default }}
    </span>
  </div>
  <div v-else class="text-gray-500 text-xs">
    -
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
});

const activeOrganization = computed(() => props.member.organizations?.[0]);
</script>

<script>
export default {
  name: 'AppMemberOrganizations',
};
</script>
