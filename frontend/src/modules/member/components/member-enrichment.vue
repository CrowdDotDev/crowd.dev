<template>
  <div class="panel !bg-purple-50">
    <div class="flex justify-between items-center">
      <div class="flex gap-2">
        <app-svg
          name="enrichment"
          class="w-5 h-5"
          color="#111827"
        />
        <span class="text-gray-900 font-semibold text-sm"
          >Member enrichment</span
        >
      </div>
      <el-tooltip placement="top" content="Learn more">
        <el-button
          class="btn btn--transparent !h-8 !w-8 !text-gray-400 hover:!text-gray-600"
          @click="onLearnMoreClick"
          ><i class="ri-question-line text-lg"
        /></el-button>
      </el-tooltip>
    </div>

    <div class="mt-4 mb-5 text-2xs text-gray-600">
      Get more insights about this member by enriching it
      with attributes such as emails, seniority, OSS
      contributions and much more.
    </div>

    <el-tooltip
      placement="top"
      content="Member enrichment requires an associated GitHub profile or Email"
      :disabled="!isEnrichmentDisabled"
    >
      <span>
        <el-button
          class="btn btn--primary btn--full !h-8"
          :disabled="isEnrichmentDisabled"
          @click="onEnrichmentClick"
          >Enrich member</el-button
        >
      </span>
    </el-tooltip>

    <div
      class="w-full text-center italic text-gray-500 text-3xs mt-2"
    >
      * requires a GitHub profile or Email
    </div>
  </div>
</template>

<script setup>
import { mapActions } from '@/shared/vuex/vuex.helpers'
import { computed, defineProps } from 'vue'
import AppSvg from '@/shared/svg/svg.vue'

const props = defineProps({
  member: {
    type: Object,
    default: () => {}
  }
})

const { doEnrich } = mapActions('member')

const isEnrichmentDisabled = computed(
  () =>
    !props.member.username?.github && !props.member.email
)

// TODO: Add link on click
const onLearnMoreClick = () => {}

const onEnrichmentClick = async () => {
  await doEnrich(props.member.id)
}
</script>
