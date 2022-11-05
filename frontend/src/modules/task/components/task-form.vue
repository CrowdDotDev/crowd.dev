<template>
  <el-drawer
    v-model="isExpanded"
    :show-close="false"
    :size="480"
  >
    <template #header="{ close }">
      <div
        class="flex justify-between items-center -mx-6 px-6"
      >
        <h2 class="text-lg font-semibold text-gray-1000">
          <span v-if="props.task && props.task.id"
            >Edit task</span
          >
          <span v-else>New task</span>
        </h2>
        <div class="flex items-center">
          <div class="flex cursor-pointer" @click="close">
            <i
              class="ri-close-line text-xl flex items-center h-6 w-6 text-gray-400"
            ></i>
          </div>
        </div>
      </div>
    </template>
    <template #default>
      <div class="-mt-3">
        <el-form
          ref="form"
          :model="model"
          :rules="rules"
          class="form mb-2"
          label-position="left"
          label-width="0px"
          @submit.prevent="doSubmit"
        >
          <el-form-item
            :prop="fields.title.name"
            class="mb-2"
          >
            <label class="text-sm mb-1 leading-5"
              >{{ fields.title.label }}
              <span class="text-brand-500">*</span></label
            >
            <el-input
              id="title"
              ref="focus"
              v-model="model[fields.title.name]"
              autocomplete="disable-autocomplete"
              type="text"
            ></el-input>
            <template #error="{ error }">
              <div class="flex items-center mt-1">
                <i
                  class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
                ></i>
                <span
                  class="pl-1 text-2xs text-red-500 leading-4.5"
                  >{{ error }}</span
                >
              </div>
            </template>
          </el-form-item>
          <el-form-item
            :prop="fields.description.name"
            class="mb-2"
          >
            <label class="text-sm mb-1 leading-5">{{
              fields.description.label
            }}</label>
            <el-input
              id="description"
              v-model="model[fields.description.name]"
              autocomplete="disable-autocomplete"
              type="textarea"
              rows="5"
            ></el-input>
            <template #error="{ error }">
              <div class="flex items-center mt-1">
                <i
                  class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
                ></i>
                <span
                  class="pl-1 text-2xs text-red-500 leading-4.5"
                  >{{ error }}</span
                >
              </div>
            </template>
          </el-form-item>
          <el-form-item
            :prop="fields.dueDate.name"
            class="mb-2 w-1/2"
          >
            <label class="text-sm mb-1 leading-5">{{
              fields.dueDate.label
            }}</label>
            <el-date-picker
              v-model="model[fields.dueDate.name]"
              :prefix-icon="CalendarIcon"
              :clearable="false"
              popper-class="date-picker-popper"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              placeholder="YYYY-MM-DD"
            />
            <template #error="{ error }">
              <div class="flex items-center mt-1">
                <i
                  class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
                ></i>
                <span
                  class="pl-1 text-2xs text-red-500 leading-4.5"
                  >{{ error }}</span
                >
              </div>
            </template>
          </el-form-item>
          <el-form-item
            ref="assigneesFormItem"
            :prop="fields.assignees.name"
            class="mb-2"
          >
            <label class="text-sm mb-1 leading-5"
              >{{ fields.assignees.label }}
              <span class="text-brand-500">*</span></label
            >
            <el-select
              id="assignees"
              v-model="model[fields.assignees.name]"
              autocomplete="disabled"
              :multiple="true"
              :filterable="true"
              :reserve-keyword="false"
              placeholder="Select assignee(s)"
              class="extend"
              @blur="assigneesFormItem.validate()"
            >
              <el-option
                v-for="assignee in assignees"
                :key="assignee.id"
                :value="assignee.id"
                :label="assignee.displayName"
                class="px-3 py-2 h-10 platform-item"
                >{{ assignee.displayName }}
              </el-option>
            </el-select>
            <template #error="{ error }">
              <div class="flex items-center mt-1">
                <i
                  class="h-4 flex items-center ri-error-warning-line text-base text-red-500"
                ></i>
                <span
                  class="pl-1 text-2xs text-red-500 leading-4.5"
                  >{{ error }}</span
                >
              </div>
            </template>
          </el-form-item>
        </el-form>
      </div>
    </template>
    <template #footer>
      <div class="w-full flex justify-end">
        <el-button class="btn btn--bordered btn--md mr-4">
          Cancel
        </el-button>
        <el-button
          class="btn btn--primary btn--md"
          :disabled="!isFormValid"
          @click="doSubmit()"
        >
          <span v-if="props.task && props.task.id"
            >Update</span
          >
          <span v-else>Add task</span>
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script>
export default {
  name: 'AppTaskForm'
}
</script>

<script setup>
import {
  computed,
  defineProps,
  defineEmits,
  defineExpose,
  ref,
  h
} from 'vue'
import { TaskModel } from '@/modules/task/task-model'
import { FormSchema } from '@/shared/form/form-schema'
const { fields } = TaskModel
const formSchema = new FormSchema([
  fields.title,
  fields.description,
  fields.dueDate,
  fields.assignees
])
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: false,
    default: false
  },
  task: {
    type: Object,
    required: false,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue'])

const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400'
  }, // props
  []
)

const rules = ref({
  title: fields.title.forFormRules(),
  description: fields.description.forFormRules(),
  dueDate: fields.dueDate.forFormRules(),
  assignees: fields.assignees.forFormRules()
})
const model = ref({
  [fields.assignees.name]: []
})
const assignees = ref([])
const assigneesFormItem = ref(null)

const isExpanded = computed({
  get() {
    return props.modelValue
  },
  set(expanded) {
    emit('update:modelValue', expanded)
  }
})

const isFormValid = computed(
  () =>
    formSchema.isValidSync(model.value) &&
    model.value.assignees.length > 0
)

const doSubmit = () => {
  console.log('submit')
}

defineExpose({ assigneesFormItem })
</script>
