<template>
  <div v-if="displayEnrichment" class="panel !p-4 !bg-purple-50">
    <div class="flex pb-3">
      <app-svg name="enriched" class="h-5 w-5" />
      <p class="pl-2 text-xs">
        <span class="font-semibold">Contact enrichment</span> requires a GitHub profile or Email address.
      </p>
    </div>
    <button type="button" class="btn btn--primary btn--sm w-full" @click="emit('edit')">
      Add GitHub or Email
    </button>
  </div>
</template>

<script setup lang="ts">
import AppSvg from '@/shared/svg/svg.vue';
import { computed } from 'vue';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import Plans from '@/security/plans';

const props = defineProps({
  member: {
    type: Object,
    default: () => {},
  },
});

const emit = defineEmits<{(e: 'edit'): void}>();

const { currentTenant } = mapGetters('auth');

const displayEnrichment = computed(() => {
  const hasAutomaticEnrichmentAvailable = [Plans.values.scale, Plans.values.enterprise].includes(currentTenant.value.plan);
  const hasGithub = props.member.identities.includes('github');
  const hasEmail = props.member.emails.length > 0;
  return hasAutomaticEnrichmentAvailable && !hasGithub && !hasEmail;
});
</script>

<script lang="ts">
export default {
  name: 'AppMemberAsideEnrichment',
};
</script>
