<template>
  <div
    v-if="props.integration?.status === 'mapping'"
    class="flex items-center gap-1"
  >
    <lf-svg name="git-repository" class="w-4 h-4" />
    Mapping repositories...
  </div>
  <lf-github-params v-else-if="props.integration?.status === 'in-progress'" :integration="props.integration" />
</template>

<script setup lang="ts">
import LfSvg from '@/shared/svg/svg.vue';
import LfGithubParams from '../../github-nango/components/github-params.vue';

const props = defineProps<{
  integration: any;
}>();
</script>

<script lang="ts">
export default {
  name: 'LfGithubStatus',
};
</script>
