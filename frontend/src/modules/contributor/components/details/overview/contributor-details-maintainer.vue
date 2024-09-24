<template>
  <div class="flex flex-wrap gap-x-2 gap-y-1">
    <lf-badge v-if="isMaintainer" type="secondary">
      Maintainer
    </lf-badge>
    <lf-badge type="secondary">
      Contributor
    </lf-badge>
  </div>
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import LfBadge from '@/ui-kit/badge/Badge.vue';
import { computed } from 'vue';

const props = defineProps<{
  contributor: Contributor,
}>();

const isMaintainer = computed(() => props.contributor.isMaintainer);
</script>
<script lang="ts">
export default {
  name: 'LfContributorDetailsMaintainer',
};
</script>
