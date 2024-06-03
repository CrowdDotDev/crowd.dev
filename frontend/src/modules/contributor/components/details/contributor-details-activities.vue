<template>
  Activities
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';

const props = defineProps<{
  contributor: Contributor,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsActivities',
};
</script>
