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
      <el-form-item class="w-1/2">
        <template #label>
          <div class="flex gap-2">
            {{ fields.employees.label }}
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
          v-model="model[fields.employees.name]"
          type="number"
          disabled
        />
      </el-form-item>
      <el-form-item class="w-1/2">
        <template #label>
          <div class="flex gap-2">
            {{ fields.revenueRange.label }}
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
        <el-select
          v-model="model[fields.revenueRange.name]"
          value-key="max"
          disabled
          placeholder=" "
        >
          <el-option
            :value="model[fields.revenueRange.name]"
            :label="revenueRange.displayValue(model[fields.revenueRange.name])"
          />
        </el-select>
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue';
import AppSvg from '@/shared/svg/svg.vue';
import revenueRange from '@/modules/organization/config/enrichment/revenueRange';

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
</script>
