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
        <el-form
          ref="form"
          label-position="top"
          class="form pt-6 pb-10"
          :rules="rules"
          :model="model"
          @submit.prevent="doSubmit"
        >
          <el-form-item
            :prop="computedFields.email.name"
            :required="computedFields.email.required"
            class="col-span-2 mb-6"
          >
            <label
              class="text-sm mb-1 font-medium leading-5"
              >{{ computedFields.email.label }}</label
            >
            <el-input
              ref="focus"
              v-model="model[computedFields.email.name]"
            />
          </el-form-item>
          <el-form-item
            :prop="computedFields.frequency.name"
            :required="computedFields.frequency.required"
            class="mb-6"
          >
            <div>
              <label
                class="text-sm mb-4 font-medium leading-5"
                >{{ computedFields.frequency.label }}</label
              >
              <el-radio-group
                v-model="
                  model[computedFields.frequency.name]
                "
              >
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
          <el-form-item
            :prop="computedFields.time.name"
            :required="computedFields.time.required"
            class="mb-6"
          >
            <div class="w-36">
              <label
                class="text-sm mb-1 font-medium leading-5"
                >{{ computedFields.time.label }}</label
              >
              <el-time-select
                v-model="model[computedFields.time.name]"
                start="00:00"
                step="00:30"
                end="23:59"
                placeholder="Select time"
                format="hh:mm A"
                :clearable="false"
              />
            </div>
          </el-form-item>

          <el-checkbox
            v-model="
              model[computedFields.updateResults.name]
            "
            class="filter-checkbox"
          >
            <span class="text-sm text-gray-900"
              >Update email results based on your current
              feed settings</span
            ></el-checkbox
          >
        </el-form>
        <hr />
        <h4
          class="text-base font-semibold text-gray-900 py-6"
        >
          Results summary
        </h4>
        <section class="pt-3 pb-1 border-b border-gray-200">
          <h6
            class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
          >
            Keywords
          </h6>
          <div class="flex flex-wrap">
            <div
              class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
            >
              Machine Learning
            </div>
            <div
              class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
            >
              Machine
            </div>
          </div>
        </section>
        <section class="pt-3 pb-1 border-b border-gray-200">
          <h6
            class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
          >
            Platforms
          </h6>
          <div class="flex flex-wrap">
            <div
              class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
            >
              DEV
            </div>
            <div
              class="border border-gray-200 mr-2 mb-2 rounded-md py-0.5 px-2 text-xs leading-5"
            >
              Medium
            </div>
          </div>
        </section>
        <section class="pt-3 pb-1">
          <h6
            class="text-2xs font-medium leading-4.5 text-gray-400 pb-2"
          >
            Date published
          </h6>
          <div class="text-xs leading-5">Last 24h</div>
        </section>
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
          :loading="loading"
          @click="doSubmit"
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
  defineEmits,
  defineProps
} from 'vue'
import { FormSchema } from '@/shared/form/form-schema'
import { EagleEyeEmailDigestModel } from '@/premium/eagle-eye/eagle-eye-email-digest-model'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const { fields } = EagleEyeEmailDigestModel
const formSchema = new FormSchema([
  fields.email,
  fields.frequency,
  fields.time,
  fields.updateResults
])
const rules = ref(formSchema.rules())
const model = ref({
  frequency: 'daily',
  time: '09:00 AM',
  updateResults: true
})

const loading = ref(false)

const computedFields = computed(() => fields)

const active = ref(false)

const drawerModel = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const doSubmit = () => {
  console.log(model);
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<style lang="scss">
.frequency-radio {
  .el-radio__input {
    @apply pt-1;
  }
}
</style>
