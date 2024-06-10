<template>
  <p class="text-medium">
    {{ props.data ? 'Yes' : 'No' }}
  </p>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: boolean,
}>();
</script>

<script lang="ts">
export default {
  name: 'LfContributorAttributeBoolean',
};
</script>
