<template>
  <div class="grid gap-x-12 grid-cols-3">
    <h6>Personal details</h6>
    <div class="col-span-2 personal-details-form">
      <el-form-item :label="fieldsValue.displayName.label">
        <el-input
          v-model="model[fieldsValue.displayName.name]"
        />
      </el-form-item>

      <el-form-item
        prop="email"
        :label="fieldsValue.email.label"
        :rules="[
          {
            type: 'email',
            message: 'Please input correct email address',
            trigger: ['blur', 'change']
          }
        ]"
      >
        <el-input v-model="model[fieldsValue.email.name]" />
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

      <div class="flex gap-6">
        <el-form-item
          class="grow"
          :label="fieldsValue.jobTitle.label"
        >
          <el-input
            v-model="defaultAttributes.jobTitle.custom"
          />
        </el-form-item>

        <el-form-item
          class="grow"
          :label="fieldsValue.organizations.label"
        >
          <el-input v-model="model.organizations" />
        </el-form-item>
      </div>

      <el-form-item :label="fieldsValue.bio.label">
        <el-input
          v-model="defaultAttributes.bio.custom"
          type="textarea"
          :rows="4"
        />
      </el-form-item>

      <el-form-item :label="fieldsValue.location.label">
        <el-input
          v-model="defaultAttributes.location.custom"
        />
      </el-form-item>

      <el-form-item :label="fieldsValue.tags.label">
        <app-keywords-input
          v-model="model[fieldsValue.tags.name]"
          placeholder="Enter tags..."
        />
      </el-form-item>
    </div>
  </div>
</template>

<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  reactive,
  watch,
  h
} from 'vue'

const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400'
  }, // props
  []
)

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

const defaultAttributes = reactive({
  jobTitle: {
    custom: ''
  },
  bio: {
    custom: ''
  },
  location: {
    custom: ''
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

watch(defaultAttributes, (attributes) => {
  model.value.attributes = attributes
})
</script>
