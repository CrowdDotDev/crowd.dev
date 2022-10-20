<template>
  <el-drawer
    v-model="isVisible"
    class="integration-twitter-drawer"
    :close-on-click-modal="false"
    @close="isVisible = false"
  >
    <template #header>
      <div class="block">
        <span
          class="block text-gray-600 text-2xs font-normal leading-none"
          >Integration</span
        >
        <div class="flex items-center pt-2">
          <img
            :src="logoUrl"
            class="w-6 h-6 mr-2"
            alt="DEV logo"
          />
          <div class="text-lg font-semibold text-black">
            Twitter
          </div>
        </div>
      </div>
    </template>
    <el-form class="form">
      <span class="block text-sm font-medium"
        >Track hashtag</span
      >
      <el-form-item>
        <app-autocomplete-one-input
          v-model="hashtags[0]"
          :fetch-fn="() => []"
          :create-fn="createTwitterHashtag"
          :allow-create="true"
          class="mt-2"
          placeholder="Enter hashtag"
        ></app-autocomplete-one-input>

        <div class="app-form-hint leading-tight mt-1">
          Tip: Choose a hashtag that's specific to your
          company/community for better data
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div>
        <el-button
          class="btn btn--md btn--bordered mr-4"
          :disabled="loading"
          @click="isVisible = false"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
        <el-button
          class="btn btn--md btn--primary"
          :disabled="connectDisabled || loading"
          :loading="loading"
          @click="save"
        >
          <app-i18n code="common.connect"></app-i18n>
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>
<script>
import integrationsJsonArray from '@/jsons/integrations.json'

export default {
  name: 'IntegrationTwitterDrawer'
}
</script>
<script setup>
import { useStore } from 'vuex'
import {
  defineEmits,
  defineProps,
  reactive,
  computed,
  onMounted
} from 'vue'

const props = defineProps({
  integration: {
    type: Object,
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const store = useStore()
let hashtags = reactive({})

const isVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    return emit('update:modelValue', value)
  }
})

const logoUrl = computed(
  () =>
    integrationsJsonArray.find(
      (i) => i.platform === 'twitter'
    ).image
)

const twitterIntegration = computed(() => {
  return store.getters['integration/active'].find(
    (i) => i.platform === props.integration.platform
  )
})

const hasHashtags = computed(() => {
  return (
    twitterIntegration.value &&
    twitterIntegration.value.settings &&
    twitterIntegration.value.settings.hashtags.length > 0
  )
})

onMounted(() => {
  hashtags = !hasHashtags.value
    ? []
    : twitterIntegration.value.settings.hashtags.map(
        (t) => {
          return { id: t, label: `#${t}` }
        }
      )
})

const createTwitterHashtag = (hashtag) => {
  // TODO: Maybe in the future it would be cool to fetch real twitter's hashtags
  const value = hashtag.replace('#', '')

  return { id: value, label: `#${value}` }
}
</script>

<style lang="scss">
.integration-devto-form {
  .el-form-item {
    @apply mb-3;
    &__content {
      @apply mb-0;
    }
  }

  .el-input-group__prepend {
    @apply px-3;
  }
}
</style>
