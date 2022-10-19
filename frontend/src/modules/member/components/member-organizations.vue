<template>
  <div v-if="props.member.organizations?.length > 0">
    <div
      v-for="organization of props.member.organizations"
      :key="organization.id"
      class="flex flex-items-center"
    >
      <div :class="{ 'h-10': showTitle }">
        <div v-if="organization.logo" class="w-5 h-5 mr-1">
          <img :src="organization.logo" alt="Logo" />
        </div>
      </div>
      <div
        class="text-gray-900"
        :class="{ 'h-10': showTitle }"
      >
        <div>{{ organization.name }}</div>
        <div
          v-if="
            props.member.attributes.jobTitle &&
            props.showTitle
          "
          class="text-gray-500 text-xs"
        >
          {{ props.member.attributes.jobTitle.default }}
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'AppMemberOrganizations'
}
</script>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  member: {
    type: Object,
    required: true
  },
  showTitle: {
    type: Boolean,
    default: true
  }
})
</script>
