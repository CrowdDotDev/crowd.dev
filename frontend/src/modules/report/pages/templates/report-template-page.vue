<template>
  <div class="absolute left-0 right-0">
    <div
      class="w-full border-b bg-gray-50 border-gray-200 pt-4 pb-6 sticky top-[-20px] z-10"
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
        <app-report-member-template />
      </div>
    </app-page-wrapper>
  </div>
</template>

<script setup>
import {
  mapGetters,
  mapActions
} from '@/shared/vuex/vuex.helpers'
import { ref, onMounted, defineProps } from 'vue'
import AppReportMemberTemplate from './report-member-template.vue'
import AppReportShareButton from '@/modules/report/components/report-share-button.vue'

const props = defineProps({
  id: {
    type: String,
    default: null
  }
})

const { doFind } = mapActions('report')

const report = ref()

const { cubejsApi } = mapGetters('widget')
const { getCubeToken } = mapActions('widget')

onMounted(async () => {
  report.value = await doFind(props.id)

  if (cubejsApi.value === null) {
    await getCubeToken()
  }
})
</script>
