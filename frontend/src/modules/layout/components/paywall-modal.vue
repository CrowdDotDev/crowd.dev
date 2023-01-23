<template>
  <app-dialog
    v-model="model"
    size="small"
    class="paywall-modal"
    :pre-title="modal.preTitle"
    :title="modal.title"
  >
    <template #content>
      <div class="px-6 pb-6">
        <div
          class="bg-image"
          :class="modal.imageWrapperClass"
        >
          <img
            class="w-11/12"
            :src="modal.imageSrc"
            :class="modal.imageClass"
          />
        </div>

        <div class="text-gray-500 text-sm">
          {{ modal.content }}
        </div>

        <router-link
          :to="{
            name: 'settings',
            query: { activeTab: 'plans' }
          }"
          @click="dismissModal"
        >
          <el-button
            class="btn btn--md btn--primary btn--full mt-8"
            >Upgrade plan</el-button
          >
        </router-link>
        <router-link
          v-if="modal.knowMore"
          :to="{
            name: 'organization'
          }"
        >
          <el-button
            class="btn btn--md btn-link btn-link--primary btn--full mt-3 !ml-0"
            >Know more</el-button
          >
        </router-link>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import { premiumFeatureCopy } from '@/utils/posthog'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  module: {
    type: String,
    required: true
  }
})

const model = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  }
})

const modal = computed(() => modalContent[props.module])

const modalContent = {
  organizations: {
    title: 'Organizations',
    preTitle: `${premiumFeatureCopy()} feature`,
    imageSrc: '/images/paywall/organizations.png',
    imageClass: 'ml-10 mt-6',
    imageWrapperClass: 'h-52',
    content:
      'Get a complete organization directory that you can search, filter, and sort instantly. Each organization also has its own profile page, which highlights key information about that organization and all the community members that belong to it',
    knowMore: true
  },
  communityHelpCenter: {
    title: 'Custom domain',
    preTitle: `${premiumFeatureCopy()} feature`,
    imageSrc: '/images/paywall/community-help-center.png',
    imageClass: 'absolute bottom-0 right-0',
    imageWrapperClass: 'h-30',
    content:
      'In order to setup a custom domain to your help center public page, a plan upgrade is required',
    knowMore: false
  }
}

const dismissModal = () => {
  model.value = false
}
</script>

<style lang="scss">
.paywall-modal {
  .bg-image {
    @apply rounded-md overflow-hidden mb-6 relative;
    background: linear-gradient(
        279.88deg,
        rgba(233, 79, 46, 0) 0%,
        rgba(233, 79, 46, 0.05) 100%
      ),
      #f9fafb;
  }
}
</style>
