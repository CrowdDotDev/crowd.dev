<template>
  <div class="flex items-center">
    <div class="w-1/2">
      <div class="flex items-center">
        <el-checkbox v-model="enabled" size="default" class="filter-checkbox" />
        <p class="pl-1 text-2xs">
          {{ getLabel(props.field as string) }}
        </p>
      </div>
    </div>
    <div class="w-1/2 py-2">
      <div class="flex items-center w-full">
        <div
          class="text-base text-gray-400 mr-4 h-4 flex items-center"
          :class="readOnly ? 'ri-arrow-right-line' : 'ri-arrow-left-right-line'"
        />
        <el-select
          v-if="props.hubspotFields.length > 0"
          v-model="mapping"
          placeholder="Select property"
          :class="[
            enabled && !mapping ? 'border-brand-400' : '',
          ]"
          class="w-full"
          clearable
          placement="bottom-end"
          filterable
        >
          <el-option
            v-for="hubspotField of props.hubspotFields"
            :key="hubspotField.name"
            :value="hubspotField.name"
            :label="hubspotField.label"
          />
        </el-select>
        <p v-else class="text-2xs leading-8">
          No matching properties
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  computed,
} from 'vue';
import { HubspotProperty } from '@/integrations/hubspot/types/HubspotProperty';

const props = defineProps<{
  modelValue: string,
  field: string,
  enabled: boolean,
  readOnly: boolean,
  hubspotFields: HubspotProperty[]
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: string): void, (e: 'update:enabled', value: boolean): void }>();

const mapping = computed<string>({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    emit('update:modelValue', value);
  },
});

const enabled = computed<boolean>({
  get() {
    return props.enabled;
  },
  set(value: boolean) {
    emit('update:enabled', value);
  },
});

const getLabel = (field: string) => {
  const label = field
    .replace('attributes.', '')
    .replace('_', ' ')
    .replace(/([A-Z])/g, ' $1');
  return label.at(0).toUpperCase() + label.substring(1).toLowerCase();
};
</script>

<script lang="ts">
export default {
  name: 'AppHubspotPropertyMap',
};
</script>

<style lang="scss">
.el-select.map-attribute{
  .el-input {
    @apply min-h-8 bg-gray-50;

    .el-input__wrapper{
      @apply bg-gray-50;
    }

    .el-input__suffix-inner {
      top: 0.5rem;
    }
  }
}

.c-select{
  @apply w-full h-8 bg-gray-50 border border-gray-100 rounded-md px-2 text-2xs text-gray-600;
}
</style>
