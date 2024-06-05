<template>
  <app-member-view-notes class="!pt-0" :member="props.contributor" />
</template>

<script setup lang="ts">
import { Contributor } from '@/modules/contributor/types/Contributor';
import AppMemberViewNotes from '@/modules/member/components/view/member-view-notes.vue';

const props = defineProps<{
  contributor: Contributor,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorDetailsNotes',
};
</script>
