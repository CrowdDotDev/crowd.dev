<template>
  <lf-dropdown width="19rem">
    <template #trigger>
      <lf-button type="secondary">
        <lf-icon name="stack-line" />
        <div class="truncate" style="max-width: 40ch;">
          <span>Issue type: </span>
          <span v-if="selectedType === 'merge-suggestions'">Merge suggestions</span>
          <span v-else>{{ dataIssueTypes[selectedType]?.label || 'Select issue type' }}</span>
        </div>
      </lf-button>
    </template>

    <lf-dropdown-item
      :selected="selectedType === 'merge-suggestions'"
      @click="selectedType = 'merge-suggestions'"
    >
      Merge suggestions
    </lf-dropdown-item>

    <lf-dropdown-item
      v-for="type in props.types"
      :key="type"
      :selected="selectedType === type"
      @click="selectedType = type"
    >
      {{ dataIssueTypes[type]?.label }}
    </lf-dropdown-item>
  </lf-dropdown>
</template>

<script lang="ts" setup>
import LfButton from '@/ui-kit/button/Button.vue';
import { computed } from 'vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { dataIssueTypes } from '@/modules/data-quality/config/data-issue-types';
import { DataIssueType } from '@/modules/data-quality/types/DataIssueType';

const props = defineProps<{
  modelValue: string;
  types: DataIssueType[]
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();

const selectedType = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

</script>

<script lang="ts">
export default {
  name: 'LfDataQualityTypeDropdown',
};
</script>
