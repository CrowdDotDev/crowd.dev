<template>
  <div
    v-if="props.integration?.status === 'mapping'"
    class="flex items-center gap-1"
  >
    <lf-svg name="git-repository" class="w-4 h-4" />
    Mapping repositories...
  </div>
</template>

<script setup lang="ts">
import LfSvg from '@/shared/svg/svg.vue';

const props = defineProps<{
  integration: any;
}>();
</script>

<script lang="ts">
export default {
  name: 'LfGithubStatus',
};
</script>
