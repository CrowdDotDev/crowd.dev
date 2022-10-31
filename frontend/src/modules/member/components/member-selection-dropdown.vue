<template>
  <div class="flex flex-col items-center gap-4">
    <i
      class="ri-account-circle-line text-gray-200 account-icon"
    ></i>
    <div class="text-gray-900 text-sm">
      Select the member you want to merge with
    </div>
    <app-member-autocomplete-input
      v-model="computedMemberToMerge"
      :fetch-fn="fetchFn"
      placeholder="Type to search member"
      input-class="w-full"
      mode="single"
    />
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  defineProps,
  defineEmits
} from 'vue'
import { MemberService } from '@/modules/member/member-service'

const emit = defineEmits('update:modelValue')
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  id: {
    type: String,
    required: true
  }
})
const loadingMemberToMerge = ref()
const computedMemberToMerge = computed({
  get() {
    return props.modelValue
  },
  async set(value) {
    loadingMemberToMerge.value = true

    const response = await MemberService.find(value.id)

    emit('update:modelValue', response)
    loadingMemberToMerge.value = false
  }
})

const fetchFn = async (query, limit) => {
  const options = await MemberService.listAutocomplete(
    query,
    limit
  )
  return options.filter((m) => {
    return m.id !== props.id
  })
}
</script>

<style>
.account-icon {
  font-size: 80px;
}
</style>
