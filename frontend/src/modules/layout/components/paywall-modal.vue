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
        <div class="bg-image">
          <img
            class="w-11/12 ml-10 mt-6"
            :src="modal.imageSrc"
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
        >
          <el-button
            class="btn btn--md btn--primary btn--full mt-8"
            >Upgrade plan</el-button
          >
        </router-link>
        <router-link
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
    preTitle: 'Growth feature',
    imageSrc: '/images/organizations-paywall.png',
    content:
      'Get a complete organization directory that you can search, filter, and sort instantly. Each organization also has its own profile page, which highlights key information about that organization and all the community members that belong to it'
  },
  // TODO: Community Help Center paywall
  'community-help-center': {}
}
</script>

<style lang="scss">
.paywall-modal {
  .bg-image {
    @apply rounded-md h-52 overflow-hidden mb-6;
    background: linear-gradient(
        279.88deg,
        rgba(233, 79, 46, 0) 0%,
        rgba(233, 79, 46, 0.05) 100%
      ),
      #f9fafb;
  }
}
</style>
