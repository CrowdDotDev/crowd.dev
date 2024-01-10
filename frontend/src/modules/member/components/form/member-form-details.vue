<template>
  <div class="grid gap-x-12 grid-cols-4">
    <h6>Personal details</h6>
    <div class="col-span-3 personal-details-form">
      <el-form-item :label="fieldsValue.displayName.label">
        <el-input
          v-model="model[fieldsValue.displayName.name]"
        />
      </el-form-item>
      <el-form-item
        :label="fieldsValue.joinedAt.label"
        class="w-6/12 grow-0"
      >
        <el-date-picker
          v-model="model[fieldsValue.joinedAt.name]"
          :clearable="false"
          :prefix-icon="CalendarIcon"
          class="custom-date-picker"
          popper-class="date-picker-popper"
          type="date"
          placeholder="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item
        class="grow"
        :label="fieldsValue.jobTitle.label"
      >
        <template #label>
          <div class="flex items-center">
            <span class="text-xs font-semibold mr-2">{{ fieldsValue.jobTitle.label }}</span>
            <el-tooltip
              v-if="getAttributeSourceName(model.attributes.jobTitle)"
              :content="`Source: ${getAttributeSourceName(model.attributes.jobTitle)}`"
              placement="top"
              trigger="hover"
            >
              <app-svg name="source" class="h-3 w-3" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="model.jobTitle" />
      </el-form-item>

      <el-form-item :label="fieldsValue.bio.label">
        <template #label>
          <div class="flex items-center">
            <span class="text-xs font-semibold mr-2">{{ fieldsValue.bio.label }}</span>
            <el-tooltip
              v-if="getAttributeSourceName(model.attributes.bio)"
              :content="`Source: ${getAttributeSourceName(model.attributes.bio)}`"
              placement="top"
              trigger="hover"
            >
              <app-svg name="source" class="h-3 w-3" />
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="model.bio"
          type="textarea"
          :rows="4"
        />
      </el-form-item>

      <el-form-item :label="fieldsValue.location.label">
        <template #label>
          <div class="flex items-center">
            <span class="text-xs font-semibold mr-2">{{ fieldsValue.location.label }}</span>
            <el-tooltip
              v-if="getAttributeSourceName(model.attributes.location)"
              :content="`Source: ${getAttributeSourceName(model.attributes.location)}`"
              placement="top"
              trigger="hover"
            >
              <app-svg name="source" class="h-3 w-3" />
            </el-tooltip>
          </div>
        </template>
        <el-input v-model="model.location" />
      </el-form-item>

      <el-form-item :label="fieldsValue.tags.label">
        <app-tag-autocomplete-input
          v-model="model[fieldsValue.tags.name]"
          :fetch-fn="fieldsValue.tags.fetchFn"
          :mapper-fn="fieldsValue.tags.mapperFn"
          :create-if-not-found="true"
          placeholder="Enter tags..."
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import {
  defineEmits, defineProps, computed, h,
} from 'vue';
import AppTagAutocompleteInput from '@/modules/tag/components/tag-autocomplete-input.vue';
import { getAttributeSourceName } from '@/shared/helpers/attribute.helpers';
import AppSvg from '@/shared/svg/svg.vue';

const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400',
  }, // props
  [],
);

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  fieldsValue: {
    type: Object,
    default: () => {},
  },
  segments: {
    type: Array,
    default: () => [],
  },
});

const model = computed({
  get() {
    return props.modelValue;
  },
  set(newModel) {
    emit('update:modelValue', newModel);
  },
});
</script>
