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
    <el-form class="form integration-twitter-form">
      <span class="block text-sm font-medium"
        >Track hashtag</span
      >
      <el-form-item>
        <el-input
          v-model="hashtag"
          class="hashtag-input"
          @change="handleHashtagChange"
        >
          <template #prefix>#</template>
        </el-input>

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
          @click="isVisible = false"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
        <a
          class="btn btn--md btn--primary"
          :href="computedConnectUrl"
        >
          <app-i18n code="common.connect"></app-i18n>
        </a>
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
import {
  defineEmits,
  defineProps,
  computed,
  onMounted,
  ref
} from 'vue'

const props = defineProps({
  integration: {
    type: Object,
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  hashtags: {
    type: Array,
    default: () => []
  },
  connectUrl: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const isVisible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    return emit('update:modelValue', value)
  }
})

let hashtag = ref('')

const logoUrl = computed(
  () =>
    integrationsJsonArray.find(
      (i) => i.platform === 'twitter'
    ).image
)

const computedConnectUrl = computed(() => {
  return hashtag.value
    ? `${props.connectUrl}&hashtags[]=${hashtag.value}`
    : ''
})

onMounted(() => {
  hashtag.value = props.hashtags[0]
})
</script>

<style lang="scss">
.integration-twitter-form {
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
