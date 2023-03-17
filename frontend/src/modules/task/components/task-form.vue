<template>
  <app-drawer
    v-model="isExpanded"
    :title="
      props.task &&
      props.task.id &&
      props.task.type !== 'suggested'
        ? 'Edit task'
        : 'New task'
    "
    size="480px"
  >
    <template #content>
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
            <label
              class="text-sm mb-1 leading-5 font-medium"
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
            <label
              class="text-sm mb-1 leading-5 font-medium"
              >{{ fields.description.label }}</label
            >
            <app-editor
              id="description"
              v-model="model[fields.description.name]"
              min-height="120px"
              autocomplete="disable-autocomplete"
              type="textarea"
              class="border rounded-md pt-2 px-3 pb-10"
              :class="{
                'border-gray-600': noteEditorFocused,
                'border-gray-300': !noteEditorFocused,
                'hover:border-gray-400': !noteEditorFocused
              }"
              @focus="noteEditorFocused = true"
              @blur="noteEditorFocused = false"
            ></app-editor>
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
            ref="relatedMembersFormItem"
            :prop="fields.relatedMembers.name"
            class="mb-2"
          >
            <label
              class="text-sm mb-1 leading-5 font-medium"
              >{{ fields.relatedMembers.label }}
            </label>
            <app-autocomplete-many-input
              id="relatedMembers"
              v-model="model[fields.relatedMembers.name]"
              :fetch-fn="fields.relatedMembers.fetchFn"
              placeholder="Select option(s)"
              :in-memory-filter="false"
            >
              <template #option="{ item }">
                <div class="flex items-center -mx-2">
                  <app-avatar
                    size="xxs"
                    :entity="{
                      displayName: item.label,
                      avatar: item.avatar
                    }"
                  ></app-avatar>
                  <p class="pl-2">{{ item.label }}</p>
                </div>
              </template>
            </app-autocomplete-many-input>
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
            <label
              class="text-sm mb-1 leading-5 font-medium"
              >{{ fields.assignees.label }}
              <span class="text-brand-500">*</span></label
            >
            <app-autocomplete-many-input
              id="assignees"
              v-model="model[fields.assignees.name]"
              :fetch-fn="fields.assignees.fetchFn"
              :mapper-fn="fields.assignees.mapperFn"
              placeholder="Select assignee(s)"
              :in-memory-filter="false"
            >
              <template #option="{ item }">
                <div class="flex items-center -mx-2">
                  <app-avatar
                    size="xxs"
                    :entity="item"
                  ></app-avatar>
                  <p class="pl-2">{{ item.displayName }}</p>
                </div>
              </template>
            </app-autocomplete-many-input>
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
            <label
              class="text-sm mb-1 leading-5 font-medium"
              >{{ fields.dueDate.label }}</label
            >
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
        </el-form>
      </div>
    </template>
    <template #footer>
      <div class="w-full flex justify-end">
        <el-button
          class="btn btn--bordered btn--md mr-4"
          @click="isExpanded = false"
        >
          Cancel
        </el-button>
        <el-button
          class="btn btn--primary btn--md"
          :disabled="!isFormValid"
          :loading="loading"
          @click="doSubmit()"
        >
          <span
            v-if="
              props.task &&
              props.task.id &&
              props.task.type !== 'suggested'
            "
            >Update</span
          >
          <span v-else>Add task</span>
        </el-button>
      </div>
    </template>
  </app-drawer>
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
  watch,
  h,
  onMounted
} from 'vue'
import { TaskModel } from '@/modules/task/task-model'
import { FormSchema } from '@/shared/form/form-schema'
import Message from '@/shared/message/message'
import { TaskService } from '@/modules/task/task-service'
import AppAutocompleteManyInput from '@/shared/form/autocomplete-many-input'
import { mapActions } from '@/shared/vuex/vuex.helpers'
import AppDrawer from '@/shared/drawer/drawer'
import AppAvatar from '@/shared/avatar/avatar'
import AppEditor from '@/shared/form/editor'

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

const emit = defineEmits(['update:modelValue', 'close'])
const noteEditorFocused = ref(false)

const { reloadTaskPage, reloadSuggestedTasks } =
  mapActions('task')

const CalendarIcon = h(
  'i',
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400'
  },
  []
)

const rules = ref({
  title: fields.title.forFormRules(),
  description: fields.description.forFormRules(),
  dueDate: fields.dueDate.forFormRules(),
  assignees: fields.assignees.forFormRules()
})
const model = ref({
  [fields.assignees.name]: [],
  [fields.relatedMembers.name]: []
})

const assigneesFormItem = ref(null)
const relatedMembersFormItem = ref(null)

const loading = ref(false)

const isExpanded = computed({
  get() {
    return props.modelValue
  },
  set(expanded) {
    emit('update:modelValue', expanded)
    if (!expanded) {
      emit('close')
    }
  }
})

const isFormValid = computed(
  () =>
    formSchema.isValidSync(model.value) &&
    (model.value.assignees || []).length > 0
)

const reset = () => {
  model.value = {
    [fields.assignees.name]: [],
    [fields.relatedMembers.name]: []
  }
  if (assigneesFormItem.value) {
    assigneesFormItem.value.resetField()
  }
  if (relatedMembersFormItem.value) {
    relatedMembersFormItem.value.resetField()
  }
}

const fillForm = () => {
  reset()
  if (props.task) {
    model.value = {
      name: props.task.name,
      body: props.task.body,
      members:
        props.task.members?.map((m) => ({
          ...m,
          label: m.displayName
        })) || [],
      assignees:
        props.task.assignees?.map((a) => ({
          ...a,
          label: a.fullName
        })) || [],
      dueDate: props.task.dueDate
    }
  } else {
    model.value = {
      members: [],
      assignees: []
    }
  }
}

watch(
  () => props.task,
  () => {
    fillForm()
  },
  {
    deep: true,
    immediate: true
  }
)

const doSubmit = () => {
  loading.value = true
  if (props.task && props.task.id) {
    TaskService.update(props.task.id, {
      ...model.value,
      type: 'regular',
      members: model.value.members.map((m) => m.id),
      assignees: model.value.assignees.map((m) => m.id)
    })
      .then(() => {
        Message.success('Task successfully updated!')
        if (props.task.type === 'suggested') {
          reloadSuggestedTasks()
        }
        reloadTaskPage()
        reset()
        isExpanded.value = false
      })
      .catch(() => {
        Message.error('There was an error updating task')
      })
      .finally(() => {
        loading.value = false
      })
  } else {
    TaskService.create({
      ...model.value,
      status: 'in-progress',
      members: (model.value.members || []).map((m) => m.id),
      assignees: (model.value.assignees || []).map(
        (m) => m.id
      )
    })
      .then(() => {
        Message.success('Task successfully created!')
        reloadTaskPage()
        reset()
        isExpanded.value = false
      })
      .catch(() => {
        Message.error('There was an error creating task')
      })
      .finally(() => {
        loading.value = false
      })
  }
}

onMounted(() => {
  fillForm()
})

defineExpose({ assigneesFormItem, relatedMembersFormItem })
</script>
