<template>
  <div class="absolute left-0 right-0">
    <div
      ref="header"
      class="w-full bg-gray-50 border-gray-200 pt-4 pb-6 sticky top-[-20px] z-10"
      :class="{
        'border-b': !isHeaderOnTop,
        shadow: isHeaderOnTop
      }"
    >
      <div class="max-w-5xl mx-auto px-8">
        <router-link
          class="btn-link--sm btn-link--secondary inline-flex items-center mb-3.5"
          :to="{ path: '/reports' }"
        >
          <i
            class="ri-arrow-left-s-line mr-2"
          />Reports</router-link
        >
        <div
          class="flex flex-grow items-center justify-between"
        >
          <h1 class="text-xl font-semibold">
            {{ report.name }}
          </h1>
          <div class="flex items-center gap-9">
            <div
              v-if="report.public"
              class="flex items-center gap-2"
            >
              <i
                class="ri-global-line text-base text-green-600"
              />
              <div
                class="text-sm text-green-600 font-medium"
              >
                Public
              </div>
            </div>
            <app-report-share-button
              :id="id"
              v-model="report.public"
            />
          </div>
        </div>
      </div>
    </div>
    <app-page-wrapper size="narrow">
      <div class="w-full mt-8">
        <app-report-member-template
          v-if="report.name === MEMBERS_REPORT.name"
        />
      </div>
    </app-page-wrapper>
  </div>
</template>

<script setup>
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import {
  ref,
  onMounted,
  onUnmounted,
  defineProps
} from 'vue'
import AppReportMemberTemplate from './report-member-template.vue'
import AppReportShareButton from '@/modules/report/components/report-share-button.vue'
import { MEMBERS_REPORT } from '@/modules/report/templates/template-reports'

const props = defineProps({
  id: {
    type: String,
    default: null
  }
})

const { doFind } = mapActions('report')

const report = ref()
const header = ref()
const wrapper = ref()
const isHeaderOnTop = ref(false)

const { cubejsApi } = mapGetters('widget')
const { getCubeToken } = mapActions('widget')

onMounted(async () => {
  report.value = await doFind(props.id)

  if (cubejsApi.value === null) {
    await getCubeToken()
  }

  wrapper.value = document.querySelector(
    '#main-page-wrapper'
  )

  wrapper.value?.addEventListener('scroll', onPageScroll)
})

onUnmounted(() => {
  wrapper.value?.removeEventListener('scroll', onPageScroll)
})

const onPageScroll = () => {
  isHeaderOnTop.value =
    header.value.getBoundingClientRect().top === 0 &&
    wrapper.value.scrollTop !== 0
}
</script>
