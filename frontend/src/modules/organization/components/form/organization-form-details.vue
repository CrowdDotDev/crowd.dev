<template>
  <div class="grid gap-x-12 grid-cols-3">
    <h6>Organization details</h6>
    <div class="col-span-2 organization-details-form">
      <el-form-item
        :label="fields.displayName.label"
        :prop="fields.displayName.name"
        required
      >
        <el-input v-model="model[fields.displayName.name]" />
        <template #error>
          <div class="el-form-item__error">
            Name is required
          </div>
        </template>
      </el-form-item>
      <el-form-item>
        <template #label>
          <div class="flex gap-2">
            {{ fields.headline.label }}
            <el-tooltip
              content="Organization enrichment"
              placement="top"
            >
              <div class="form-enrichment-badge">
                <app-svg name="enrichment" />
              </div>
            </el-tooltip>
          </div>
        </template>
        <el-input
          v-model="model[fields.headline.name]"
          disabled
          type="textarea"
        />
      </el-form-item>
      <el-form-item :label="fields.description.label">
        <el-input
          v-model="model[fields.description.name]"
          type="textarea"
        />
      </el-form-item>
      <el-form-item :label="fields.website.label">
        <el-input v-model="model[fields.website.name]" />
      </el-form-item>
      <el-form-item
        :label="fields.location.label"
        class="w-1/2"
      >
        <el-input v-model="model[fields.location.name]" />
      </el-form-item>
      <el-form-item
        label="Number of employees"
        class="w-1/2"
      >
        <el-input
          v-model="model[fields.employees.name]"
          type="number"
        />
      </el-form-item>
      <el-form-item
        :label="fields.revenueRange.label"
        class="w-1/2"
      >
        <el-select
          v-model="model[fields.revenueRange.name]"
          value-key="max"
        >
          <el-option
            v-for="option in revenueOptions"
            :key="option.id"
            :value="option.value"
            :label="option.label"
          />
        </el-select>
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue';
import AppSvg from '@/shared/svg/svg.vue';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  fields: {
    type: Object,
    default: () => {},
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

const revenueOptions = [
  {
    label: '$0-1M',
    value: {
      min: 0,
      max: 1,
    },
  },
  {
    label: '$1M-$10M',
    value: {
      min: 1,
      max: 10,
    },
  },
  {
    label: '$11M-$50M',
    value: {
      min: 11,
      max: 50,
    },
  },
  {
    label: '$51M-$100M',
    value: {
      min: 51,
      max: 100,
    },
  },
  {
    label: '$101M-$250M',
    value: {
      min: 101,
      max: 250,
    },
  },
  {
    label: '$251M-$500M',
    value: {
      min: 251,
      max: 500,
    },
  },
  {
    label: '$501M-$1B',
    value: {
      min: 501,
      max: 1000,
    },
  },
  {
    label: '$1B-$10B',
    value: {
      min: 1001,
      max: 10000,
    },
  },
  {
    label: '$10B+',
    value: {
      min: 10001,
    },
  },
];
</script>
