<template>
  <app-dialog
    v-if="isModalOpen"
    v-model="isModalOpen"
    title="Merge suggestions"
    size="2extra-large"
    custom-class="mt-6 mb-6"
  >
    <template #content>
      <app-organization-merge-suggestions :query="props.query" class="!shadow-none -mt-5" />
    </template>
  </app-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppOrganizationMergeSuggestions from '@/modules/organization/components/organization-merge-suggestions.vue';
import AppDialog from '@/shared/dialog/dialog.vue';

const props = defineProps<{
  modelValue: boolean,
  query?: any
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void}>();

const isModalOpen = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set() {
    emit('update:modelValue', false);
  },
});
</script>

<script lang="ts">
export default {
  name: 'AppOrganizationMergeSuggestionsDialog',
};
</script>
