<template>
  <app-dialog
    v-if="isModalOpen"
    v-model="isModalOpen"
    title="Merge suggestions"
    size="2extra-large"
    :show-header="false"
  >
    <template #content>
      <div class="-mt-12">
        <app-organization-merge-suggestions
          :offset="props.offset"
          :query="props.query"
          class="!border-t-0 !shadow-none -mt-5"
          @reload="emit('reload')"
        >
          <template #actions>
            <lf-button type="secondary-ghost-light" :icon-only="true" @click="isModalOpen = false">
              <lf-icon name="xmark" />
            </lf-button>
          </template>
        </app-organization-merge-suggestions>
      </div>
    </template>
  </app-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppOrganizationMergeSuggestions from '@/modules/organization/components/organization-merge-suggestions.vue';
import AppDialog from '@/shared/dialog/dialog.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';

const props = withDefaults(defineProps<{
  modelValue: boolean,
  query?: any
  offset?: number
}>(), {
  query: {},
  offset: 0,
});

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void, (e: 'reload'): void}>();

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
