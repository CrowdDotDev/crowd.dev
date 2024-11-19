<template>
  <div
    v-if="props.integration?.status === 'mapping'"
    class="flex items-center gap-1"
  >
    <lf-icon-old name="git-repository-line" :size="16" />
    Mapping repositories...
  </div>
</template>

<script setup lang="ts">
import LfIconOld from '@/ui-kit/icon/IconOld.vue';

const props = defineProps<{
  integration: any;
}>();
</script>

<script lang="ts">
export default {
  name: 'LfGitlabStatus',
};
</script>
