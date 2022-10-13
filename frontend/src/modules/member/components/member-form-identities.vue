<template>
  <div class="grid gap-x-12 grid-cols-3">
    <div>
      <h6>
        Identities <span class="text-brand-500">*</span>
      </h6>
      <p class="text-gray-500 text-2xs leading-normal mt-1">
        Connect with members external data sources or
        profiles
      </p>
    </div>
    <div class="col-span-2 identities-form">
      <div
        v-for="[key, value] in Object.entries(
          identitiesForm
        )"
        :key="key"
      >
        <div
          v-if="findPlatform(key)"
          class="border-b border-gray-200"
        >
          <el-form-item class="h-14 !flex items-center">
            <div :class="value.imgContainerClass">
              <img
                :src="findPlatform(key).image"
                :alt="findPlatform(key).name"
                class="w-4 h-4"
              />
            </div>
            <el-switch
              v-model="value.enabled"
              :inactive-text="findPlatform(key).name"
              @change="
                (newValue) => onSwitchChange(newValue, key)
              "
            />
          </el-form-item>

          <el-form-item
            v-if="value.enabled"
            :prop="`username.${key}`"
            required
            class="mt-1 !mb-6"
          >
            <el-input
              v-model="model.username[key]"
              @input="
                (newValue) =>
                  onInputChange(newValue, key, value)
              "
            >
              <template #prepend
                ><span>{{ value.urlPrefix }}</span>
                <span class="text-brand-500"
                  >*</span
                ></template
              >
            </el-input>
            <template #error>
              <div class="el-form-item__error">
                Identity profile is required
              </div>
            </template>
          </el-form-item>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  defineEmits,
  defineProps,
  computed,
  watch
} from 'vue'
import integrationsJsonArray from '@/jsons/integrations.json'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  record: {
    type: Object,
    default: () => {}
  },
  modelValue: {
    type: Object,
    default: () => {}
  }
})

const identitiesForm = ref({
  devto: {
    enabled: false,
    urlPrefix: 'dev.to/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base bg-gray-100 border border-gray-200'
  },
  discord: {
    enabled: false,
    urlPrefix: 'discord.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--discord cursor-auto hover:cursor-auto'
  },
  github: {
    enabled: false,
    urlPrefix: 'github.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base bg-gray-100 border border-gray-200'
  },
  slack: {
    enabled: false,
    urlPrefix: 'slack.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--slack cursor-auto hover:cursor-auto bg-white border border-gray-200'
  },
  twitter: {
    enabled: false,
    urlPrefix: 'twitter.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--twitter'
  }
})

const member = computed(() => props.record)
const model = computed({
  get() {
    return props.modelValue
  },
  set(newModel) {
    emit('update:modelValue', newModel)
  }
})

watch(member, (newMember) => {
  Object.entries(identitiesForm.value).forEach(([key]) => {
    identitiesForm.value[key].enabled =
      !!newMember.username[key]
  })
})

function findPlatform(platform) {
  return integrationsJsonArray.find(
    (p) => p.platform === platform
  )
}

function onSwitchChange(value, key) {
  if (value) {
    model.value.platform = key
  }

  // Add platform to username object
  if (
    (model.value.username?.[key] === null ||
      model.value.username?.[key] === undefined) &&
    value
  ) {
    model.value.username[key] = ''
    return
  }

  // Remove platform from username object
  if (!value) {
    delete model.value.username[key]
    delete model.value.attributes?.url?.[key]
  }

  // Handle platfom and attributes when username profiles are removed
  if (!Object.keys(model.value.username || {}).length) {
    delete model.value.platform
    delete model.value.attributes?.url
  }
}

function onInputChange(newValue, key, value) {
  model.value.attributes = {
    ...props.modelValue.attributes,
    url: {
      ...props.modelValue.attributes?.url,
      [key]: `${value.urlPrefix}${newValue}`
    }
  }
}
</script>
