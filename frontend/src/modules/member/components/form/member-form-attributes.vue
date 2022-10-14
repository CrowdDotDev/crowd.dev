<template>
  <div class="grid gap-x-12 grid-cols-3 mb-16">
    <div>
      <h6>Custom attributes</h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Add custom data points to enhance the member profile
      </p>
      <el-button
        class="btn btn-link btn-link--sm btn-link--primary mt-3"
        @click="() => emit('openDrawer')"
        >Manage custom attributes</el-button
      >
    </div>
    <div class="col-span-2">
      <div
        class="grid grid-cols-12 gap-3 border-b h-8 items-center"
      >
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide col-span-3"
          >Name</span
        >
        <span
          class="uppercase text-gray-400 text-2xs font-semibold tracking-wide col-span-9"
          >Value</span
        >
      </div>
      <div
        v-if="!!customAttributes.length"
        class="custom-attributes-form flex mt-4 mb-2 flex-col gap-4"
      >
        <div
          v-for="(attribute, index) in customAttributes"
          :key="index"
          class="grid grid-cols-12 gap-3"
        >
          <div class="col-span-3 flex flex-col gap-1">
            <span
              class="text-gray-900 text-xs font-medium"
              >{{ attribute.label }}</span
            >
            <span class="text-2xs text-gray-500">{{
              attributesTypes[attribute.type]
            }}</span>
          </div>
          <el-form-item class="col-span-9">
            <el-date-picker
              v-if="attribute.type === 'date'"
              v-model="model[attribute.name]"
              clearable
              :prefix-icon="CalendarIcon"
              class="custom-date-picker"
              popper-class="date-picker-popper"
              type="date"
              placeholder="YYYY-MM-DD"
            />
            <el-select
              v-else-if="attribute.type === 'boolean'"
              v-model="model[attribute.name]"
              class="w-full"
              clearable
              placeholder="Select option"
            >
              <el-option
                key="true"
                label="True"
                :value="true"
              />
              <el-option
                key="false"
                label="False"
                :value="false"
              />
            </el-select>

            <el-input
              v-else
              v-model="model[attribute.name]"
              :type="attribute.type"
              clearable
            ></el-input
            ><template #error>
              <div class="el-form-item__error">
                Value is required
              </div>
            </template></el-form-item
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'

const attributesTypes = {
  string: 'Text',
  number: 'Number',
  email: 'E-mail',
  url: 'URL',
  date: 'Date',
  boolean: 'Boolean'
}

const emit = defineEmits([
  'update:modelValue',
  'openDrawer'
])
const props = defineProps({
  attributes: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Object,
    default: () => {}
  }
})

const customAttributes = computed(() =>
  props.attributes.filter(
    (attribute) => attribute.canDelete
  )
)

const model = computed({
  get() {
    return props.modelValue
  },
  set(newModel) {
    emit('update:modelValue', newModel)
  }
})
</script>
