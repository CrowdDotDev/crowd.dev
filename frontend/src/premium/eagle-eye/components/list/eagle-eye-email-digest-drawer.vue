<template>
  <app-drawer v-model="drawerModel" title="Email Digest">
    <template #beforeTitle>
      <i
        class="ri-mail-open-line text-xl h-6 text-gray-900 flex items-center mr-3"
      ></i>
    </template>
    <template #content>
      <div class="pb-8">
        <!-- active header -->
        <div
          class="bg-gray-100 px-6 py-4 -mx-6 flex justify-between -mt-5"
        >
          <div>
            <h5 class="text-sm font-medium mb-1">Active</h5>
            <p class="text-2xs text-gray-500">
              If active, you will receive an email with up
              to 10 most relevant results from Eagle Eye,
              based on your settings.
            </p>
          </div>
          <div>
            <el-switch v-model="active" />
          </div>
        </div>
        <div :class="{ 'opacity-50': !active }">
          <el-form
            ref="formRef"
            label-position="top"
            class="form pt-6 pb-10"
            :rules="rules"
            :model="model"
            @submit.prevent="doSubmit"
          >
            <el-form-item
              prop="email"
              class="col-span-2 mb-6"
            >
              <label
                class="text-sm mb-1 font-medium leading-5"
                >Email
                <span class="text-brand-500">*</span></label
              >
              <el-input ref="focus" v-model="model.email" :disabled="!active" />
            </el-form-item>
            <el-form-item prop="frequency" class="mb-6">
              <div>
                <label
                  class="text-sm mb-4 font-medium leading-5"
                  >Frequency</label
                >
                <el-radio-group v-model="model.frequency" :disabled="!active">
                  <el-radio
                    label="daily"
                    size="large"
                    class="frequency-radio !flex items-start mb-3"
                  >
                    <h6
                      class="text-sm leading-5 font-medium mb-1"
                    >
                      Daily
                    </h6>
                    <p
                      class="text-2xs leading-4.5 text-gray-500"
                    >
                      From Monday to Friday (results from
                      previous day)
                    </p>
                  </el-radio>
                  <el-radio
                    label="weekly"
                    size="large"
                    class="frequency-radio !flex items-start"
                  >
                    <h6
                      class="text-sm leading-5 font-medium mb-1"
                    >
                      Weekly
                    </h6>
                    <p
                      class="text-2xs leading-4.5 text-gray-500"
                    >
                      Every Monday (results from previous
                      week)
                    </p>
                  </el-radio>
                </el-radio-group>
              </div>
            </el-form-item>
            <el-form-item prop="time" class="mb-6">
              <div class="w-36">
                <label
                  class="text-sm mb-1 font-medium leading-5"
                  >Time</label
                >
                <el-time-select
                  v-model="model.time"
                  start="00:00"
                  step="00:30"
                  end="23:59"
                  placeholder="Select time"
                  format="hh:mm A"
                  :disabled="!active"
                  :clearable="false"
                />
              </div>
            </el-form-item>

            <el-checkbox
              v-model="model.updateResults"
              class="filter-checkbox"
              :disabled="!active"
            >
              <span class="text-sm text-gray-900"
                >Update email results based on your current
                feed settings</span
              ></el-checkbox
            >
          </el-form>
          <hr />
          <!-- Results summary -->
          <div v-if="currentUser">
            <h4
              class="text-base font-semibold text-gray-900 py-6"
            >
              Results summary
            </h4>
            <section
              class="pt-3 pb-1 border-b border-gray-200"
            >
              <h6
                class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
              >
                Keywords
              </h6>
              <div class="flex flex-wrap">
                <div
                  v-for="semantic of currentUser
                    .eagleEyeSettings.feed.keywords"
                  :key="semantic"
                  class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
                >
                  {{ semantic }}
                </div>
                <div
                  v-for="exact of currentUser
                    .eagleEyeSettings.feed.exactKeywords"
                  :key="exact"
                  class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
                >
                  {{ exact }}
                </div>
              </div>
            </section>
            <section
              class="pt-3 pb-1 border-b border-gray-200"
            >
              <h6
                class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
              >
                Platforms
              </h6>
              <div class="flex flex-wrap">
                <div
                  v-for="excluded of currentUser
                    .eagleEyeSettings.feed.excludedKeywords"
                  :key="excluded"
                  class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
                >
                  {{ excluded }}
                </div>
              </div>
            </section>
            <section class="pt-3 pb-1">
              <h6
                class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
              >
                Date published
              </h6>
              <div class="text-xs leading-5">
                {{
                  currentUser.eagleEyeSettings.feed
                    .publishedDate
                }}
              </div>
            </section>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--transparent mr-3"
          @click="handleCancel"
          >Cancel
        </el-button>
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :loading="loadingUpdateSettings"
          @click="doSubmit(formRef)"
          >Update
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import AppDrawer from '@/shared/drawer/drawer.vue'
import {
  ref,
  computed,
  reactive,
  defineEmits,
  defineProps,
  onMounted,
  watch
} from 'vue'
import {
  mapActions,
  mapGetters,
  mapState
} from '@/shared/vuex/vuex.helpers'
import Message from '@/shared/message/message'
import moment from 'moment'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const { currentUser } = mapGetters('auth')
const { doUpdateSettings } = mapActions('eagleEye')
const { loadingUpdateSettings } = mapState('eagleEye')

const emit = defineEmits(['update:modelValue'])

const rules = {
  email: [
    {
      required: true,
      message: 'This field is required',
      trigger: 'blur'
    }
  ],
  frequency: [
    {
      required: true,
      message: 'This field is required',
      trigger: 'blur'
    }
  ],
  time: [
    {
      required: true,
      message: 'This field is required',
      trigger: 'blur'
    }
  ]
}

const model = reactive({
  frequency: 'daily',
  time: '09:00 AM',
  updateResults: true
})

const active = ref(false)
const formRef = ref()

const drawerModel = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      fillForm(currentUser.value)
    }
  }
)

const fillForm = (user) => {
  const { eagleEyeSettings } = user
  active.value = eagleEyeSettings.emailDigestActive || true
  model.email =
    eagleEyeSettings.emailDigest?.email || user.email
  model.frequency =
    eagleEyeSettings.emailDigest?.frequency || 'daily'
  model.time =
    eagleEyeSettings.emailDigest?.time || '09:00 AM'
  model.updateResults =
    eagleEyeSettings.emailDigest?.matchFeedSettings || true
}
const doSubmit = async (formEl) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      const data = {
        email: model.email,
        frequency: model.frequency,
        time: moment(model.time, 'hh:mm A').utc().format('hh:mm'),
        matchFeedSettings: model.updateResults,
        feed: currentUser.value.eagleEyeSettings.feed
      }
      await doUpdateSettings({
        ...currentUser.value.eagleEyeSettings,
        emailDigestActive: active.value,
        emailDigest:
          active.value || currentUser.value.emailDigest
            ? data
            : undefined
      })
      Message.success('Feed settings updated!')
      emit('update:modelValue', false)
    }
  })
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

onMounted(() => {
  fillForm(currentUser.value)
})
</script>

<style lang="scss">
.frequency-radio {
  .el-radio__input {
    @apply pt-1;
  }
}
</style>
