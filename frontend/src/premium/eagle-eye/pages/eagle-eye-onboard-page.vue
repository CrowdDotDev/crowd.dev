<template>
  <div class="max-w-2xl mx-auto">
    <div class="panel !p-0">
      <!-- Banner -->
      <eagle-eye-banner
        :title="headerContent.title"
        :pre-title="headerContent.preTitle"
        :show-image="headerContent.showImage"
      />

      <!-- Content -->
      <div class="px-8 pb-8 pt-9">
        <eagle-eye-intro
          v-if="step === 1"
          @on-step-change="onStepChange"
        />
        <eagle-eye-keywords
          v-if="step === 2"
          v-model="keywords"
          @on-step-change="onStepChange"
        />
        <eagle-eye-platforms
          v-if="step === 3"
          v-model:platforms="platforms"
          v-model:publishedDate="publishedDate"
          @on-step-change="onStepChange"
        />
        <eagle-eye-summary
          v-if="step === 4"
          @on-step-change="onStepChange"
          @on-submit="onSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  reactive,
  ref,
  onMounted,
  onBeforeUnmount
} from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { premiumFeatureCopy } from '@/utils/posthog'
import EagleEyeBanner from '@/premium/eagle-eye/components/onboard/eagle-eye-banner.vue'
import EagleEyeIntro from '@/premium/eagle-eye/components/onboard/eagle-eye-intro.vue'
import EagleEyeKeywords from '@/premium/eagle-eye/components/onboard/eagle-eye-keywords.vue'
import EagleEyePlatforms from '@/premium/eagle-eye/components/onboard/eagle-eye-platforms.vue'
import EagleEyeSummary from '@/premium/eagle-eye/components/onboard/eagle-eye-summary.vue'
import {
  platformOptions,
  publishedDateOptions
} from '@/premium/eagle-eye/eagle-eye-constants'
import ConfirmDialog from '@/shared/dialog/confirm-dialog.js'
import moment from 'moment'
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { useStore } from 'vuex'

const store = useStore()
const router = useRouter()
const { doUpdateProfile } = mapActions('auth')
const { currentUser } = mapGetters('auth')
const step = ref(1)
const headerContent = computed(() => {
  if (step.value === 1) {
    return {
      title: 'Eagle Eye',
      preTitle: `${premiumFeatureCopy()} App`,
      showImage: true
    }
  }

  return {
    title: 'Set up your feed',
    preTitle: 'Eagle Eye'
  }
})

const keywords = reactive([
  {
    value: null,
    type: 'semantic'
  }
])
const publishedDate = ref(publishedDateOptions[0].label)
const wasFormSubmittedSuccessfuly = ref(false)
const storeUnsubscribe = ref(() => {})
const platforms = reactive(platformOptions)

// Prevent lost data on route change
onBeforeRouteLeave((to) => {
  if (
    step.value > 1 &&
    !wasFormSubmittedSuccessfuly.value &&
    to.fullPath !== '/500'
  ) {
    return ConfirmDialog({})
      .then(() => {
        return true
      })
      .catch(() => {
        return false
      })
  }

  return true
})

onMounted(() => {
  storeUnsubscribe.value = store.subscribe((mutation) => {
    if (mutation.type === 'auth/UPDATE_PROFILE_SUCCESS') {
      wasFormSubmittedSuccessfuly.value = true
      router.push({ name: 'eagleEye' })
    }
  })
})

onBeforeUnmount(() => {
  storeUnsubscribe.value()
})

const onStepChange = (increment) => {
  step.value = step.value + increment
}

const onSubmit = async () => {
  const publishedDateObject = publishedDateOptions.find(
    (o) => o.label === publishedDate.value
  )
  const formattedPublishedDate = [
    moment()
      .utc()
      .subtract(
        publishedDateObject.period,
        publishedDateObject.granularity
      )
      .startOf('day')
      .toISOString(),
    moment().utc().toISOString()
  ]
  const formattedKeywords = keywords
    .filter((k) => k.type === 'semantic')
    .map((k) => k.value)
  const formattedExactKeywords = keywords
    .filter((k) => k.type === 'exact')
    .map((k) => k.value)
  const formattedPlatforms = Object.entries(platforms)
    .filter(([, value]) => value.enabled)
    .map(([key]) => key)

  const updatedUser = {
    ...currentUser.value,
    eagleEyeSettings: {
      onboarded: true,
      feed: {
        keywords: formattedKeywords,
        exactKeywords: formattedExactKeywords,
        excludedKeywords: [],
        publishedDate: formattedPublishedDate,
        platforms: formattedPlatforms
      }
    }
  }

  await doUpdateProfile({
    data: updatedUser,
    showSuccessMessage: false
  })
}
</script>
