<template>
  <div class="flex items-center gap-3">
    <div>
      <div
        class="min-h-8 min-w-8 w-8 h-8 border border-gray-200 rounded flex items-center justify-center overflow-hidden"
        :class="{
          'bg-white': organization.logo,
          'bg-gray-50': !organization.logo
        }"
      >
        <img
          v-if="organization.logo"
          :src="organization.logo"
          alt="Logo"
          class="max-h-8"
        />
        <i
          v-else
          class="ri-community-line text-2xl text-gray-300"
        ></i>
      </div>
    </div>
    <div class="overflow-hidden">
      <el-tooltip
        :content="organization.name"
        effect="dark"
        placement="top"
        :disabled="!showTooltip"
      >
        <div
          ref="nameRef"
          class="font-semibold text-sm text-gray-900 overflow-hidden whitespace-nowrap text-ellipsis"
          @mouseover="handleOnMouseOver"
          @mouseleave="handleOnMouseLeave"
        >
          {{ organization.name }}
        </div>
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
import { computed, defineProps, ref } from 'vue'
import moment from 'moment/moment'

const props = defineProps({
  organization: {
    type: Object,
    default: () => null
  }
})

const nameRef = ref()
const showTooltip = ref(false)

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

const handleOnMouseOver = () => {
  if (!nameRef.value) {
    showTooltip.value = false
  }

  showTooltip.value =
    nameRef.value.scrollWidth > nameRef.value.clientWidth
}

const handleOnMouseLeave = () => {
  showTooltip.value = false
}
</script>
