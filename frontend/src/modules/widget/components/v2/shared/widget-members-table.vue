<template>
  <div v-if="members.length" class="my-8">
    <router-link
      v-for="member in members"
      :key="member.id"
      class="h-14 border-b border-gray-100 last:border-none grid grid-cols-8 gap-4 hover:bg-gray-50 hover:cursor-pointer group"
      :to="{
        name: 'memberView',
        params: { id: member.id }
      }"
      @click="onRowClick"
    >
      <div class="flex gap-3 items-center col-span-3">
        <app-avatar :entity="member" size="sm" />
        <div class="flex flex-col">
          <span class="font-medium text-xs text-gray-900">{{
            member.displayName
          }}</span>
          <span
            v-if="member.organizations?.length"
            class="text-gray-500 text-2xs"
            >{{ member.organizations?.[0]?.name }}</span
          >
        </div>
      </div>

      <div
        class="text-xs text-gray-500 italic flex items-center col-span-2"
      >
        {{ member.activeDaysCount }} days active
      </div>

      <div class="flex gap-3 items-center">
        <div
          v-for="platform in Object.keys(
            member.username || {}
          )"
          :key="platform"
        >
          <el-tooltip
            popper-class="custom-identity-tooltip"
            placement="top"
          >
            <template #content
              ><span
                ><span class="capitalize">{{
                  platform
                }}</span
                >profile
                <i
                  v-if="member.attributes?.url?.[platform]"
                  class="ri-external-link-line text-gray-400"
                ></i></span
            ></template>

            <a
              :href="
                member.attributes?.url?.[platform] || null
              "
              target="_blank"
              class="hover:cursor-pointer"
              :style="{
                minWidth: '32px'
              }"
              @click.stop
            >
              <app-svg
                :name="platform"
                class="max-w-[16px] h-4"
                color="#D1D5DB"
                hover-color="#4B5563"
              /> </a
          ></el-tooltip>
        </div>
      </div>

      <div
        class="inline-flex items-center justify-end mr-4 invisible group-hover:visible font-medium text-2xs text-gray-600 gap-1 col-start-8"
      >
        <span>Profile</span>
        <i class="ri-arrow-right-s-line" />
      </div>
    </router-link>
  </div>

  <div
    v-else
    class="w-full text-center h-20 flex items-center justify-center mb-10"
  >
    <i
      class="ri-bar-chart-fill animate-pulse text-gray-300 text-5xl"
    ></i>
  </div>
</template>

<script>
export default {
  name: 'AppWidgetTable'
}
</script>

<script setup>
import { defineProps, defineEmits } from 'vue'
import AppSvg from '@/shared/svg/svg.vue'

const emit = defineEmits(['onRowClick'])
defineProps({
  members: {
    type: Array,
    default: () => []
  }
})

const onRowClick = () => {
  emit('onRowClick')
}
</script>
