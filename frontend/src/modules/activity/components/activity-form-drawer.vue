<template>
  <app-drawer
    v-model="isVisible"
    :size="480"
    :title="isEdit ? 'Edit activity' : 'Add activity'"
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
            :filterable="true"
            :remote="true"
            placeholder="Select option"
            :remote-method="searchMembers"
            :loading="loadingMembers"
            class="w-full"
            @change="
              selectMember($event) && $v.config.url.$touch()
            "
            @blur="$v.config.url.$touch"
          >
            <template
              v-if="form.member && selectedMember"
              #prefix
            >
              <app-avatar
                :entity="{
                  displayName: selectedMember.label,
                  avatar: selectedMember.avatar
                }"
                size="xxs"
              ></app-avatar>
            </template>
            <el-option
              v-for="item in membersList"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            >
              <app-avatar
                :entity="{
                  displayName: item.label,
                  avatar: item.avatar
                }"
                size="xxs"
                class="mr-2"
              ></app-avatar>
              {{ item.label }}
            </el-option>
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
            @blur="$v.config.url.$touch"
            @change="$v.config.url.$touch"
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
          <el-select
            v-model="form.activityType"
            placeholder="Select option"
            class="w-full"
            @blur="$v.config.url.$touch"
            @change="$v.config.url.$touch"
          >
            <div
              class="px-3 py-2.5 text-brand-500 text-xs leading-5 transition hover:bg-gray-50 cursor-pointer"
              @click="emit('add-activity-type')"
            >
              + Add activity type
            </div>
            <div
              v-if="Object.keys(types.custom).length > 0"
              class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
            >
              Custom
            </div>
            <template
              v-for="(
                activityTypes, platform
              ) in types.custom"
              :key="platform"
            >
              <el-option
                v-for="(display, type) in activityTypes"
                :key="type"
                :label="display.short"
                :value="type"
              >
                {{ display.short }}
              </el-option>
            </template>
            <template
              v-for="(
                activityTypes, platform
              ) in types.default"
              :key="platform"
            >
              <div
                class="text-2xs text-gray-400 font-semibold tracking-wide leading-6 uppercase px-3 my-1"
              >
                {{ platformDetails(platform).name }}
              </div>
              <el-option
                v-for="(display, type) in activityTypes"
                :key="type"
                :label="display.short"
                :value="type"
              >
                <img
                  :src="platformDetails(platform).image"
                  class="h-4 w-4 mr-2"
                  :alt="platformDetails(platform).name"
                />
                {{ display.short }}
              </el-option>
            </template>
          </el-select>
        </app-form-item>

        <app-form-item class="mb-4" label="Title">
          <el-input v-model="form.config.title" />
        </app-form-item>

        <app-form-item class="mb-4" label="Body">
          <el-input
            v-model="form.config.body"
            type="textarea"
            rows="5"
          />
        </app-form-item>

        <app-form-item
          class="mb-4"
          label="URL"
          :validation="$v.config.url"
          :error-messages="{ url: 'Url is not valid' }"
        >
          <el-input
            v-model="form.config.url"
            @blur="$v.config.url.$touch"
            @change="$v.config.url.$touch"
          />
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
        :disabled="$v.$invalid || !hasFormChanged"
        @click="submit()"
      >
        <span v-if="isEdit">Update</span>
        <span v-else>Add activity</span>
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
  h,
  watch
} from 'vue'
import AppDrawer from '@/shared/drawer/drawer.vue'
import { required, url } from '@vuelidate/validators'
import useVuelidate from '@vuelidate/core'
import AppFormItem from '@/shared/form/form-item.vue'
import { MemberService } from '@/modules/member/member-service'
import AppAvatar from '@/shared/avatar/avatar.vue'
import { useActivityTypeStore } from '@/modules/activity/store/type'
import { storeToRefs } from 'pinia'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { ActivityService } from '@/modules/activity/activity-service'
import Message from '@/shared/message/message'
import formChangeDetector from '@/shared/form/form-change'
import { mapActions } from '@/shared/vuex/vuex.helpers'

// Props & emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  activity: {
    type: Object,
    required: false,
    default: () => null
  }
})

const emit = defineEmits([
  'update:modelValue',
  'add-activity-type'
])

// Store
const activityTypeStore = useActivityTypeStore()
const { types } = storeToRefs(activityTypeStore)

const { doFetch } = mapActions('activity')

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

const selectedMember = ref(null)

const selectMember = (id) => {
  selectedMember.value = membersList.value.find(
    (m) => m.id === id
  )
}

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
  },
  name: {}
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

// Platform details
const platformDetails = (platform) => {
  return CrowdIntegrations.getConfig(platform)
}

// Form utils
watch(
  () => props.activity(),
  (activity) => {
    if (activity) {
      fillForm(activity)
    }
  },
  { immediate: true, deep: true }
)

const { hasFormChanged, formSnapshot } =
  formChangeDetector(form)

const isEdit = computed(() => {
  return props.activity
})

const fillForm = (activity) => {
  form.member = activity?.member?.id || ''
  form.datetime = activity?.timestamp || ''
  form.activityType = activity?.type || ''
  form.config.title = activity?.title || ''
  form.config.body = activity?.body || ''
  form.config.url = activity?.url || ''
  formSnapshot()
}

const reset = () => {
  form.member = ''
  form.datetime = ''
  form.activityType = ''
  form.config.title = ''
  form.config.body = ''
  form.config.url = ''
}
const generateSourceId = () => {
  const randomNumbers = (Math.random() + '').substring(2)
  return `gen-${randomNumbers}`
}

const platformsForActivityType = computed(() => {
  return Object.entries({
    ...types.value.custom,
    ...types.value.default
  })
    .map(([platform, types]) =>
      Object.keys(types).map((type) => ({
        platform,
        type
      }))
    )
    .flat()
    .reduce((object, { platform, type }) => {
      object[type] = platform
      return object
    }, {})
})

// Submit
const submit = () => {
  if ($v.value.$invalid) {
    return
  }
  const data = {
    member: form.member,
    timestamp: form.datetime,
    type: form.activityType,
    platform:
      platformsForActivityType.value[form.activityType],
    ...form.config
  }

  if (!isEdit.value) {
    // Create
    ActivityService.create({
      data: {
        ...data,
        sourceId: generateSourceId()
      }
    })
      .then(() => {
        reset()
        emit('update:modelValue', false)
        doFetch({})
        Message.success('Activity successfully created!')
      })
      .catch(() => {
        Message.error(
          'There was an error creating activity'
        )
      })
  } else {
    // Update
    ActivityService.update(props.activity.id, data)
      .then(() => {
        reset()
        emit('update:modelValue', false)
        doFetch({})
        Message.success('Activity successfully updated!')
      })
      .catch(() => {
        Message.error(
          'There was an error updating activity'
        )
      })
  }
}
</script>
