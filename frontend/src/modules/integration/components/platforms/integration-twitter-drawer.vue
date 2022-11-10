<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-twitter-drawer"
    title="Twitter"
    size="600px"
    pre-title="Integration"
    :pre-title-img-src="logoUrl"
    pre-title-img-alt="Twitter logo"
    @close="isVisible = false"
  >
    <template #content>
      <el-form
        class="form integration-twitter-form"
        @submit.prevent
      >
        <span class="block text-sm font-medium"
          >Track hashtag</span
        >
        <el-form-item>
          <el-input v-model="hashtag" class="hashtag-input">
            <template #prefix>#</template>
          </el-input>

          <div class="app-form-hint leading-tight mt-1">
            Tip: Choose a hashtag that's specific to your
            company/community for better data
          </div>
        </el-form-item>
      </el-form>
    </template>

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
          Update
        </a>
      </div>
    </template>
  </app-drawer>
</template>
<script>
import integrationsJsonArray from '@/jsons/integrations.json'
import { useRouter, useRoute } from 'vue-router'
import Message from '@/shared/message/message'

export default {
  name: 'IntegrationTwitterDrawer'
}
</script>
<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  ref,
  onMounted
} from 'vue'

const route = useRoute()
const router = useRouter()
const props = defineProps({
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

const hashtag = ref(
  props.hashtags.length
    ? props.hashtags[props.hashtags.length - 1]
    : null
)

const logoUrl = computed(
  () =>
    integrationsJsonArray.find(
      (i) => i.platform === 'twitter'
    ).image
)

const computedConnectUrl = computed(() => {
  return `${props.connectUrl}&hashtags[]=${hashtag.value}`
})

onMounted(() => {
  const isConnectionSuccessful = route.query.success

  if (isConnectionSuccessful) {
    router.replace({ query: null })
    Message.success('Integration updated successfuly')
  }
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
