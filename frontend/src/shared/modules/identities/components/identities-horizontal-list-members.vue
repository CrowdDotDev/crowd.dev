<template>
  <div class="flex flex-wrap gap-2">
    <template v-for="identity in limitedIdentities" :key="identity.id">
      <a
        v-if="identity.url"
        :href="getIdentityUrl(identity.url)"
        target="_blank"
        rel="noopener noreferrer"
        class="text-medium cursor-pointer !text-black underline decoration-dashed
         decoration-gray-400 underline-offset-4 hover:decoration-gray-900 max-w-48 truncate"
      >
        {{ identity.value }}
      </a>
      <span v-else class="text-medium max-w-48 truncate">
        {{ identity.value }}
      </span>
    </template>
    <span v-if="member.identities.length > limit" class="text-medium text-gray-400">
      +{{ member.identities.length - limit }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';

const props = defineProps({
  member: {
    type: Object,
    required: true,
  },
  limit: {
    type: Number,
    default: 5,
  },
  projectGroupId: {
    type: String,
    default: '',
  },
});

const limitedIdentities = computed(() => props.member.identities.slice(0, props.limit));

const getIdentityUrl = (url) => {
  if (!url || !props.projectGroupId) return url;
  const identityUrl = new URL(url);
  identityUrl.searchParams.append('projectGroup', props.projectGroupId);
  return identityUrl.toString();
};
</script>

<script lang="ts">
export default {
  name: 'AppIdentitiesHorizontalListMembers',
};
</script>
