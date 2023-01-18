<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-linkedin-drawer"
    title="LinkedIn"
    size="600px"
    pre-title="Integration"
    :pre-title-img-src="logoUrl"
    pre-title-img-alt="LinkedIn logo"
    @close="isVisible = false"
  >
    <template #content>
      <div
        class="flex flex-col gap-2 items-start mb-2"
      ></div>
      <el-form
        label-position="top"
        class="form integration-linkedin-form"
        @submit.prevent
      >
        <div class="flex flex-col gap-2 items-start">
          <span class="block text-sm font-semibold mb-2"
            >Organization profile</span
          >
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor all comments and reactions to posts or
            shares from one of your associated organization
            profiles. <br />
          </span>
          <el-select
            v-model="model"
            placeholder="Select option"
          >
            <el-option
              v-for="organization of organizations"
              :key="organization.id"
              :label="organization.name"
              :value="organization.name"
            />
          </el-select>
          <div class="text-yellow-600 flex items-start">
            <i class="ri-alert-line mr-2"></i>
            <div class="text-sm pt-0.5">
              <span class="font-medium"
                >Action required.</span
              >
              Select one of your associated organization
              profiles to start tracking LinkedIn activities
            </div>
          </div>
        </div>
      </el-form>
    </template>

    <template #footer>
      <div
        class="flex grow items-center"
        :class="
          hasFormChanged ? 'justify-between' : 'justify-end'
        "
      >
        <el-button
          v-if="hasFormChanged"
          class="btn btn-link btn-link--primary"
          @click="doReset"
          ><i class="ri-arrow-go-back-line"></i>
          <span>Reset changes</span></el-button
        >
        <div class="flex gap-4">
          <el-button
            class="btn btn--md btn--bordered"
            @click="isVisible = false"
          >
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
          <el-button
            class="btn btn--md btn--primary"
            :class="{
              disabled: !hasFormChanged || connectDisabled
            }"
            @click="hasFormChanged ? connect() : undefined"
          >
            {{
              integration.settings?.organizations.length > 0
                ? 'Update'
                : 'Connect'
            }}
          </el-button>
        </div>
      </div>
    </template>
  </app-drawer>
</template>
<script>
export default {
  name: 'AppLinkedInConnectDrawer'
}
</script>
<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  ref,
  watch
} from 'vue'
import { useThrottleFn } from '@vueuse/core'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { useStore } from 'vuex'
import Pizzly from '@nangohq/pizzly-frontend'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import config from '@/config'
import isEqual from 'lodash/isEqual'

const store = useStore()

const tenantId = computed(() => AuthCurrentTenant.get())

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  integration: {
    type: Object,
    default: () => {}
  }
})

const emit = defineEmits(['update:modelValue'])
const organizations =
  props.integration.settings?.organizations.map((i) => {
    return {
      value: i,
      validating: false,
      touched: true,
      valid: true
    }
  }) || [{ value: '', loading: false }]

const model = ref(JSON.parse(JSON.stringify(organizations)))

const logoUrl =
  CrowdIntegrations.getConfig('linkedin').image

const connectDisabled = computed(() => {
  return (
    model.value.filter((s) => {
      return (
        s.valid === false ||
        s.value === '' ||
        s.touched !== true
      )
    }).length > 0
  )
})

const isVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    return emit('update:modelValue', value)
  }
})

const hasFormChanged = computed(
  () =>
    !isEqual(
      organizations.map((i) => i.value),
      model.value.map((i) => i.value)
    )
)

const doReset = () => {
  model.value = JSON.parse(JSON.stringify(organizations))
}

const callOnboard = useThrottleFn(async () => {
  await store.dispatch('integration/doRedditOnboard', {
    subreddits: model.value.map((i) => i.value)
  })
}, 2000)

const connect = async () => {
  const pizzly = new Pizzly(
    config.pizzlyUrl,
    config.pizzlyPublishableKey
  )
  try {
    await pizzly.auth(
      'linkedin',
      `${tenantId.value}-linkedin`
    )
    await callOnboard()
    emit('update:modelValue', false)
  } catch (e) {
    console.log(e)
  }
}

watch(isVisible, (newValue, oldValue) => {
  if (newValue) {
    window.analytics.track('LinkedIn: settings drawer', {
      action: 'open'
    })
  } else if (newValue === false && oldValue) {
    window.analytics.track('LinkedIn: settings drawer', {
      action: 'close'
    })
  }
})
</script>
