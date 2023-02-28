<template>
  <div class="flex flex-col items-center gap-4">
    <i
      class="ri-account-circle-line text-gray-200 account-icon"
    ></i>
    <div class="text-gray-900 text-sm">
      Select the member you want to merge with
    </div>
    <div class="flex">
      <app-autocomplete-one-input
        v-model="computedMemberToMerge"
        :fetch-fn="fetchFn"
        :total-fn="totalFn"
        placeholder="Type to search members"
        input-class="w-full"
      ></app-autocomplete-one-input>
    </div>
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

const totalFn = async () => {
  try {
    const response = await MemberService.list({}, '', 1, 0)

    return response.count
  } catch (e) {
    return null
  }
}
</script>

<style>
.account-icon {
  font-size: 80px;
}
</style>
