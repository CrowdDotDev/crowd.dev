<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-reddit-drawer"
    title="Reddit"
    size="600px"
    pre-title="Integration"
    :pre-title-img-src="logoUrl"
    pre-title-img-alt="Reddit logo"
    @close="isVisible = false"
  >
    <template #content>
      <div class="flex flex-col gap-2 items-start mb-2">
      </div>
      <el-form
        label-position="top"
        class="form integration-reddit-form"
        @submit.prevent
      >
        <div class="flex flex-col gap-2 items-start">
          <span class="block text-sm font-semibold mb-2"
            >Track subreddits</span
          >
          <span
            class="text-2xs font-light mb-2 text-gray-600"
          >
            Monitor posts, and their comments, from your community's subreddits. <br />
          </span>
          <el-form-item
            v-for="(subreddit, index) of model"
            :key="index"
          >
            <div class="flex w-full gap-2">
              <el-input
                v-model="subreddit.value"
                @blur="handleSubredditValidation(index)"
              >
                <template #prepend>reddit.com/r/</template>
                <template #suffix>
                  <div
                    v-if="subreddit.validating"
                    v-loading="subreddit.validating"
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
              v-if="subreddit.touched && !subreddit.valid"
              class="el-form-item__error pt-1"
              >Subreddit does not exist</span
            >
          </el-form-item>
          <el-button
            class="btn btn-link btn-link--primary"
            @click="addItem"
            >+ Add subreddit</el-button
          >
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
              integration.settings?.subreddits.length > 0
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
  name: 'AppRedditConnectDrawer'
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
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { useStore } from 'vuex'
import Pizzly from '@nangohq/pizzly-frontend'
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant'
import config from '@/config'
import isEqual from 'lodash/isEqual'
import { IntegrationService } from '@/modules/integration/integration-service'

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
const subreddits =
  props.integration.settings?.subreddits.map((i) => {
    return {
      value: i,
      validating: false,
      touched: true,
      valid: true
    }
  }) || [{ value: '', loading: false }]

const model = ref(JSON.parse(JSON.stringify(subreddits)))

const logoUrl = CrowdIntegrations.getConfig('reddit').image

const hasFormChanged = computed(
  () =>
    !isEqual(
      subreddits.map((i) => i.value),
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

const addItem = () => {
  model.value.push({
    value: '',
    validating: false
  })
}
const deleteItem = (index) => {
  model.value.splice(index, 1)
}

const doReset = () => {
  model.value = JSON.parse(JSON.stringify(subreddits))
}

const handleSubredditValidation = async (index) => {
  try {
    let subreddit = model.value[index].value

    subreddit = subreddit.replace('https://', '')
    subreddit = subreddit.replace('http://', '')
    subreddit = subreddit.replace('reddit.com', '')
    subreddit = subreddit.replace('/r/', '')
    subreddit = subreddit.replace('r/', '')

    model.value[index].value = subreddit
    model.value[index].validating = true
    const response =
      await IntegrationService.redditValidate(
        model.value[index].value
      )
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

const connect = async () => {
  const pizzly = new Pizzly(
    config.pizzlyUrl,
    config.pizzlyPublishableKey
  )
  try {
    await pizzly.auth('reddit', `${tenantId.value}-reddit`)
    await store.dispatch('integration/doRedditOnboard', {
      subreddits: model.value.map((i) => i.value)
    })
    emit('update:modelValue', false)
  } catch (e) {
    console.log(e)
  }
}

watch(isVisible, (newValue, oldValue) => {
  if (newValue) {
    window.analytics.track('Reddit Connect Drawer Opened')
  } else if (newValue === false && oldValue) {
    window.analytics.track('Reddit Connect Drawer Closed')
  }
})
</script>

<style lang="scss">
.integration-reddit-form {
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
