<template>
  <app-drawer
    v-model="isVisible"
    :size="480"
    title="Add activity"
  >
    <template #content>
      <div class="-mt-4">
        <app-form-item
          class="mb-4"
          label="Member"
          :validation="$v.member"
          :required="true"
          :error-messages="{
            required: 'This field is required'
          }"
        >
          <el-select
            v-model="form.member"
            filterable="true"
            remote="true"
            placeholder="Select option"
            :remote-method="searchMembers"
            :loading="loadingMembers"
            class="w-full"
          >
            <el-option
              v-for="item in membersList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            />
          </el-select>
        </app-form-item>

        <app-form-item
          class="mb-4"
          label="When"
          :validation="$v.datetime"
          :required="true"
          :error-messages="{
            required: 'This field is required'
          }"
        >
          <el-date-picker
            v-model="form.datetime"
            type="datetime"
            placeholder="Select date & time"
            :prefix-icon="CalendarIcon"
          />
        </app-form-item>

        <app-form-item
          class="mb-4"
          label="Activity type"
          :validation="$v.activityType"
          :required="true"
          :error-messages="{
            required: 'This field is required'
          }"
        >
        </app-form-item>

        <app-form-item class="mb-4" label="Title">
          <el-input v-model="form.config.title" />
        </app-form-item>

        <app-form-item class="mb-4" label="Body">
          <el-input
            v-model="form.config.body"
            type="textarea"
          />
        </app-form-item>

        <app-form-item class="mb-4" label="URL">
          <el-input v-model="form.config.url" />
        </app-form-item>
      </div>
    </template>
    <template #footer>
      <el-button
        class="btn btn--bordered btn--md mr-4"
        @click="emit('update:modelValue', false)"
        >Cancel</el-button
      >
      <el-button
        class="btn btn--primary btn--md"
        @click="submit()"
      >
        <span>Add activity type</span>
      </el-button>
    </template>
  </app-drawer>
</template>

<script>
export default {
  name: 'AppActivityFormDrawer'
}
</script>

<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  reactive,
  ref,
  h
} from 'vue'
import AppDrawer from '@/shared/drawer/drawer.vue'
import { required, url } from '@vuelidate/validators'
import useVuelidate from '@vuelidate/core'
import AppFormItem from '@/shared/form/form-item.vue'
import { MemberService } from '@/modules/member/member-service'

// Props & emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// Is drawer visible
const isVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

// Form control
const form = reactive({
  member: '',
  datetime: '',
  activityType: '',
  config: {
    title: '',
    body: '',
    url: ''
  }
})

const rules = {
  member: {
    required
  },
  datetime: {
    required
  },
  activityType: {
    required
  },
  config: {
    url: {
      url
    }
  }
}

const $v = useVuelidate(rules, form)

// Members field
const loadingMembers = ref(false)
const membersList = ref([])
const searchMembers = (query, limit) => {
  loadingMembers.value = true
  MemberService.listAutocomplete(query, limit)
    .then((options) => {
      membersList.value = options
    })
    .catch(() => {
      membersList.value = []
    })
    .finally(() => {
      loadingMembers.value = false
    })
}

// Datetime field
const CalendarIcon = h(
  'i', // type
  {
    class:
      'ri-calendar-line text-base leading-none text-gray-400'
  }, // props
  []
)

// Submit
const submit = () => {
  if ($v.value.$invalid) {
    return
  }
  const data = {
    member: form.member,
    datetime: form.datetime,
    activityType: form.activityType,
    ...form.config
  }
  console.log(data)

  // TODO: submit
}
</script>
