<template>
  <div class="flex items-center gap-3">
    <div v-if="organization.logo">
      <div
        class="w-8 h-8 border border-gray-200 rounded flex items-center justify-center"
        :class="{
          'bg-white': organization.logo,
          'bg-gray-200': !organization.logo
        }"
      >
        <img
          v-if="organization.logo"
          :src="organization.logo"
          alt="Logo"
        />
        <i
          v-else
          class="ri-community-line text-lg text-gray-300"
        ></i>
      </div>
    </div>
    <div>
      <el-tooltip
        :content="organization.name"
        effect="dark"
        placement="top"
        :disabled="!isTextTruncated(scope.row.id)"
      >
        <span
          :id="`organizationName-${scope.row.id}`"
          class="font-semibold text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis"
          >{{ organization.name }}</span
        >
      </el-tooltip>
      <el-tooltip
        v-if="isNew"
        placement="top"
        :content="newTooltipContent"
      >
        <div
          v-if="isNew"
          class="badge badge--brand inline-flex uppercase !text-3xs !px-1 !py-0 leading-normal font-semibold mt-1"
        >
          New
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppOrganizationName'
}
</script>

<script setup>
import { computed, defineProps } from 'vue'
import moment from 'moment/moment'

const props = defineProps({
  organization: {
    type: Object,
    default: () => null
  }
})

const isNew = computed(() => {
  return (
    moment().diff(
      moment(props.organization.joinedAt),
      'days'
    ) <= 14
  )
})

const newTooltipContent = computed(
  () =>
    `Active since ${moment(
      props.organization.joinedAt
    ).format('MMM DD, YYYY')}`
)

const isTextTruncated = (id) => {
  const element = document.querySelector(
    `#organizationName-${id}`
  )

  if (!element) {
    return false
  }

  return element.scrollWidth > element.clientWidth
}
</script>
