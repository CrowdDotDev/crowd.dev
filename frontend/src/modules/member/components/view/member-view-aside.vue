<template>
  <div class="member-view-aside panel">
    <div>
      <div class="flex items-center justify-between">
        <div class="font-medium text-black">Identities</div>
        <el-button
          class="btn btn-link btn-link--primary"
          @click="identitiesDrawer = true"
          >Manage Identities</el-button
        >
      </div>
      <div class="-mx-6 mt-6">
        <a
          v-for="platform of filteredPlatforms"
          :key="platform"
          class="px-6 py-2 flex items-center relative"
          :class="
            member.attributes.url &&
            member.attributes.url[platform] !== undefined
              ? 'hover:bg-gray-50 transition-colors cursor-pointer'
              : ''
          "
          :href="
            member.attributes.url &&
            member.attributes.url[platform]
          "
          target="_blank"
        >
          <span
            class="btn cursor-auto p-2 bg-gray-100 border border-gray-200 mr-3"
            :class="`btn--${platform}`"
          >
            <img
              :src="findIcon(platform)"
              :alt="`${platform}-icon`"
              class="w-4 h-4"
            />
          </span>
          <span class="text-gray-900 text-xs">
            {{ member.username[platform] }}</span
          >
          <i
            v-if="
              member.attributes.url &&
              member.attributes.url[platform]
            "
            class="ri-external-link-line absolute right-0 inset-y mr-4 text-gray-400"
          ></i>
        </a>
      </div>
    </div>
    <div
      v-if="computedCustomAttributes.length > 0"
      class="mt-10"
    >
      <div class="font-medium text-black mb-6">
        Custom attributes
      </div>
      <div
        v-for="(
          attribute, index
        ) of computedCustomAttributes"
        :key="attribute.id"
        class="py-3"
        :class="
          index < computedCustomAttributes.length - 1
            ? 'border-b border-gray-200'
            : ''
        "
      >
        <p class="text-gray-400 font-medium text-2xs">
          {{ attribute.label }}
        </p>
        <p class="mt-1 text-gray-900 text-xs">
          {{
            formattedComputedAttributeValue(
              member.attributes[attribute.name].default
            )
          }}
        </p>
      </div>
    </div>
    <app-member-manage-identities-drawer
      v-model="identitiesDrawer"
      :member="member"
    />
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewAside'
}
</script>

<script setup>
import { useStore } from 'vuex'
import { computed, defineProps, ref } from 'vue'
import integrationsJsonArray from '@/jsons/integrations.json'
import AppMemberManageIdentitiesDrawer from '../member-manage-identities-drawer'
import moment from 'moment'

const store = useStore()

const props = defineProps({
  member: {
    type: Object,
    default: () => {}
  }
})

const identitiesDrawer = ref(false)

const computedCustomAttributes = computed(() => {
  return Object.values(
    store.state.member.customAttributes
  ).filter((attribute) => {
    return (
      attribute.show &&
      attribute.canDelete &&
      props.member.attributes[attribute.name]
    )
  })
})

const filteredPlatforms = computed(() => {
  const supported = integrationsJsonArray
    .filter((i) => i.active)
    .map((i) => i.platform)
  return Object.keys(props.member.username).filter((p) => supported.includes(p))
})

const findIcon = (platform) => {
  const platformData = integrationsJsonArray.find(
    (p) => p.platform === platform
  )
  return platformData ? platformData.image : null
}

const formattedComputedAttributeValue = (value) => {
  const dateFormat = 'YYYY-MM-DD'
  return moment(value, dateFormat, true).isValid()
    ? moment(value).format('YYYY-MM-DD')
    : value
}
</script>
