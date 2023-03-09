<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-reddit-drawer"
    title="Stack Overflow"
    size="600px"
    pre-title="Integration"
    :pre-title-img-src="logoUrl"
    pre-title-img-alt="Stack Overflow logo"
    @close="isVisible = false"
  >
    <template #content>
      <div class="flex flex-col min-h-full gap-2">
        <el-form
          label-position="top"
          class="form integration-reddit-form grow"
          @submit.prevent
        >
          <div
            class="flex flex-col min-h-full gap-2 items-start"
          >
            <span class="block text-sm font-semibold mb-2"
              >Track tags</span
            >
            <span
              class="text-2xs font-light mb-2 text-gray-600"
            >
              Monitor questions and answers based on your
              selected tags. We will only match questions
              containing all of your tags (max 5). <br />
            </span>
            <el-form-item
              v-for="(tag, index) of model"
              :key="index"
              class="mb-4 w-full"
            >
              <div class="flex w-full gap-2">
                <el-input
                  v-model="tag.value"
                  placeholder="Enter a Tag"
                  @blur="handleTagValidation(index)"
                >
                  <template #suffix>
                    <div
                      v-if="tag.validating"
                      v-loading="tag.validating"
                      class="flex items-center justify-center w-6 h-6"
                    ></div>
                  </template>
                </el-input>
                <el-button
                  v-if="model.length > 1"
                  class="btn btn--md btn--transparent w-10 h-10"
                  @click="deleteItem(index)"
                >
                  <i
                    class="ri-delete-bin-line text-lg text-black"
                  ></i>
                </el-button>
              </div>
              <span
                v-if="tag.touched && !tag.valid"
                class="el-form-item__error pt-1"
                >Tag does not exist</span
              >
            </el-form-item>
            <el-button
              v-if="!isMaxTagsReached"
              class="btn btn-link btn-link--primary"
              @click="addNewTag"
              >+ Add Tag
            </el-button>
          </div>
        </el-form>
        <el-form>
          <el-form-item>
            Estimated number of questions:
            <b
              >&nbsp;
              {{
                estimatedQuestions.toLocaleString('en-US')
              }}</b
            >
            <span
              v-if="isMaxQuestionsReached"
              class="el-form-item__error pt-1"
              >Volume of questions is too big. Add more
              specific tags or remove too broad ones. If you
              really want to use these tags, please reach
              out to us.</span
            >
          </el-form-item>
        </el-form>
      </div>
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
              integration.settings?.tags.length > 0
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
  name: 'AppStackOverflowConnectDrawer'
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
import Nango from '@nangohq/frontend'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import config from '@/config'
import isEqual from 'lodash/isEqual'
import { IntegrationService } from '@/modules/integration/integration-service'

const MAX_STACK_OVERFLOW_QUESTIONS = 10000

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
const tags = props.integration.settings?.tags.map((i) => {
  return {
    value: i,
    validating: false,
    touched: true,
    valid: true
  }
}) || [{ value: '', loading: false }]

const model = ref(JSON.parse(JSON.stringify(tags)))
const estimatedQuestions = ref(0)
const isVolumeUpdating = ref(false)

const logoUrl =
  CrowdIntegrations.getConfig('stackoverflow').image

const hasFormChanged = computed(
  () =>
    !isEqual(
      tags.map((i) => i.value),
      model.value.map((i) => i.value)
    )
)

const connectDisabled = computed(() => {
  return (
    model.value.filter((s) => {
      return (
        s.valid === false ||
        s.value === '' ||
        s.touched !== true
      )
    }).length > 0 ||
    isMaxQuestionsReached.value ||
    isVolumeUpdating.value
  )
})

const isValidating = computed(() => {
  return model.value.filter((s) => s.validating).length > 0
})

const isMaxQuestionsReached = computed(() => {
  return (
    estimatedQuestions.value > MAX_STACK_OVERFLOW_QUESTIONS
  )
})

const shouldCalculateVolume = computed(() => {
  return (
    model.value.filter((s) => {
      return (
        s.valid === false ||
        s.value === '' ||
        s.touched !== true
      )
    }).length == 0
  )
})

watch(
  () => model.value,
  async () => {
    isVolumeUpdating.value = true
    if (shouldCalculateVolume.value) {
      estimatedQuestions.value = await calculateVolume()
    } else if (!isValidating.value) {
      estimatedQuestions.value = 0
    }
    isVolumeUpdating.value = false
  },
  { immediate: true, deep: true }
)

const calculateVolume = async () => {
  const tags = model.value.map((i) => i.value).join(';')
  const data = await IntegrationService.stackOverflowVolume(
    tags
  )
  return data
}

const isVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    return emit('update:modelValue', value)
  }
})

const maxId = computed(() => {
  return Math.max(...model.value.map((i) => i.id), 0)
})

const isMaxTagsReached = computed(() => {
  return model.value.length >= 5
})

const deleteItem = (index) => {
  model.value.splice(index, 1)
}

const addNewTag = (tag) => {
  model.value.push({
    id: maxId.value + 1,
    tag:
      typeof tag === 'string' || tag instanceof String
        ? tag
        : '',
    touched: false,
    valid: false,
    validating: false
  })
}

const doReset = () => {
  model.value = JSON.parse(JSON.stringify(tags))
}

const handleTagValidation = async (index) => {
  try {
    const tag = model.value[index].value
    model.value[index].validating = true
    const response =
      await IntegrationService.stackOverflowValidate(tag)
    console.log(response)
    model.value[index].valid = true
  } catch (e) {
    console.log(e)
    model.value[index].valid = false
  } finally {
    model.value[index].validating = false
    model.value[index].touched = true
  }
}

const callOnboard = useThrottleFn(async () => {
  await store.dispatch(
    'integration/doStackOverflowOnboard',
    {
      tags: model.value.map((i) => i.value)
    }
  )
}, 2000)

const connect = async () => {
  const nango = new Nango({ host: config.nangoUrl })
  try {
    await nango.auth(
      'stackexchange',
      `${tenantId.value}-stackoverflow`
    )
    await callOnboard()
    emit('update:modelValue', false)
  } catch (e) {
    console.log(e)
  }
}

watch(isVisible, (newValue, oldValue) => {
  if (newValue) {
    window.analytics.track(
      'Stack Ooverflow: connect drawer',
      {
        action: 'open'
      }
    )
  } else if (newValue === false && oldValue) {
    window.analytics.track(
      'Stack Overflow: connect drawer',
      {
        action: 'close'
      }
    )
  }
})
</script>

<style lang="scss">
.integration-stackoverflow-form {
  .el-form-item {
    @apply mb-3;
    &__content {
      @apply mb-0;
      .hashtag-input .el-input__inner {
        @apply pl-1;
      }
    }
  }

  .el-input-group__prepend {
    @apply px-3;
  }
}
</style>
