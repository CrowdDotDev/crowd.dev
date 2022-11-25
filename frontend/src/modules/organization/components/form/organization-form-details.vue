<template>
  <div class="grid gap-x-12 grid-cols-3">
    <h6>Organization details</h6>
    <div class="col-span-2 organization-details-form">
      <el-form-item :label="fieldsValue.name.label">
        <el-input v-model="model[fieldsValue.name.name]" />
      </el-form-item>
      <el-form-item :label="fieldsValue.description.label">
        <el-input
          v-model="model[fieldsValue.description.name]"
          type="textarea"
        />
      </el-form-item>
      <el-form-item :label="fieldsValue.url.label">
        <el-input v-model="model[fieldsValue.url.name]" />
      </el-form-item>
      <el-form-item :label="fieldsValue.employees.label">
        <el-select
          v-model="model[fieldsValue.employees.name]"
        >
          <el-option label="1-10" value="1-10" />
          <el-option label="11-50" value="11-50" />
          <el-option label="51-200" value="51-200" />
          <el-option label="51-200" value="51-200" />
          <el-option label="201-500" value="201-500" />
          <el-option label="501-1000" value="501-1000" />
          <el-option label="1001-5000" value="1001-5000" />
          <el-option
            label="5001-10000"
            value="5001-10000"
          />
          <el-option label="10000+" value="10000+" />
        </el-select>
      </el-form-item>
      <!--<el-form-item :label="fieldsValue.location.label">
        <el-input
          v-model="model[fieldsValue.location.name]"
        />
      </el-form-item>-->
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps, computed } from 'vue'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {}
  },
  fieldsValue: {
    type: Object,
    default: () => {}
  }
})

const model = computed({
  get() {
    return props.modelValue
  },
  set(newModel) {
    emit('update:modelValue', newModel)
  }
})
</script>
