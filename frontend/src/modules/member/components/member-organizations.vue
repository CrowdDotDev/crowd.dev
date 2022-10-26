<template>
  <div v-if="orientation === 'vertical'">
    <div v-if="props.member.organizations?.length > 0">
      <div
        v-for="organization of props.member.organizations"
        :key="organization.id"
        class="flex items-start"
      >
        <div v-if="organization.logo">
          <div class="w-5 h-5 mr-1">
            <img :src="organization.logo" alt="Logo" />
          </div>
        </div>
        <div>
          <p
            class="text-gray-900 text-sm text-ellipsis truncate"
          >
            {{ organization.name || '-' }}
          </p>
          <div
            v-if="props.showTitle"
            class="text-gray-500 text-2xs"
          >
            {{
              props.member.attributes.jobTitle?.default ||
              '-'
            }}
          </div>
        </div>
      </div>
    </div>
    <div
      v-else-if="props.member.attributes.jobTitle?.default"
    >
      <p class="text-gray-900 text-ellipsis truncate">-</p>
      <div
        v-if="props.showTitle"
        class="text-gray-500 text-2xs"
      >
        {{
          props.member.attributes.jobTitle?.default || '-'
        }}
      </div>
    </div>
    <div v-else class="text-gray-900">-</div>
  </div>
  <div v-else>
    <div
      v-if="
        member.attributes.jobTitle?.default ||
        props.member.organizations?.length
      "
      class="flex items-center mt-2"
    >
      <span
        v-if="member.attributes?.jobTitle?.default"
        class="text-gray-600 text-2xs mr-2"
        >{{ member.attributes.jobTitle.default }}
        {{ member.organizations.length ? 'at' : '' }}</span
      >
      <p
        v-if="member.organizations.length"
        class="text-gray-900 text-sm text-ellipsis truncate flex flex-wrap items-center"
      >
        <img
          :src="member.organizations[0].logo"
          alt="Logo"
          class="w-5 h-5 mr-1"
        />
        {{ member.organizations[0].name || '-' }}
      </p>
    </div>
    <div v-else class="text-gray-900">-</div>
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
  },
  orientation: {
    type: String,
    default: () => 'vertical'
  }
})
</script>
