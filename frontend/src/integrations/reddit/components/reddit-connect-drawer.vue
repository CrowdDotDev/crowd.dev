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
      <el-form
        label-position="top"
        class="form integration-reddit-form"
        @submit.prevent
      >
        <el-form-item
          v-for="(subreddit, index) of model"
          :key="index"
        >
          <div class="flex w-full gap-2">
            <el-input v-model="subreddit.value">
              <template #suffix>
                <div
                  v-if="subreddit.validating"
                  v-loading="subreddit.validating"
                  class="flex items-center justify-center w-6 h-6"
                ></div>
              </template>
            </el-input>
            <el-button
              class="btn btn--md btn--transparent w-10 h-10"
              @click="deleteItem(index)"
            >
              <i
                class="ri-delete-bin-line text-lg text-black"
              ></i>
            </el-button>
          </div>
        </el-form-item>
        <el-button
          class="btn btn-link btn-link--primary"
          @click="addItem"
          >+ Add subreddit</el-button
        >
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
              disabled: !hasFormChanged
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
  ref
} from 'vue'
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

const model = ref(
  props.integration.settings?.subreddits || [
    { value: '', loading: false }
  ]
)

const logoUrl = CrowdIntegrations.getConfig('reddit').image

const hasFormChanged = computed(
  () =>
    !isEqual(
      props.integration.settings?.subreddits || [
        { value: '', loading: false }
      ],
      model.value
    )
)

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
  model.value = props.integration.settings?.subreddits || [
    { value: '', loading: false }
  ]
}

const connect = async () => {
  const pizzly = new Pizzly(config.pizzlyUrl, config.pizzlyPublishableKey)
  await pizzly.auth('reddit', `${tenantId.value}-reddit`)
  await store.dispatch('integration/doRedditOnboard', {
    subreddits: model.value.map((i) => i.value)
  })
}
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
