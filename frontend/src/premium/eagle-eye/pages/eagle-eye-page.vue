<template>
  <!-- <app-page-wrapper size="full-width"> -->
  <div
    class="absolute top-0 left-0 w-full max-h-screen flex flex-row"
    :class="{
      'pt-[55px]': showBanner
    }"
  >
    <div
      class="basis-3/12 overflow-auto overscroll-contain"
    >
      <app-eagle-eye-settings />
    </div>

    <div
      class="basis-9/12 overflow-auto overscroll-contain pl-3"
    >
      <app-eagle-eye-tabs />
      <app-eagle-eye-list />
    </div>
  </div>
  <!-- </app-page-wrapper> -->
</template>

<script>
export default {
  name: 'AppEagleEye'
}
</script>

<script setup>
import AppEagleEyeTabs from '@/premium/eagle-eye/components/list/eagle-eye-tabs.vue'
import AppEagleEyeSettings from '@/premium/eagle-eye/components/list/eagle-eye-settings.vue'
import AppEagleEyeList from '@/premium/eagle-eye/components/list/eagle-eye-list.vue'
import { mapGetters } from '@/shared/vuex/vuex.helpers'
import { onMounted } from 'vue'
import { EagleEyeService } from '../eagle-eye-service'

const { showBanner } = mapGetters('tenant')

onMounted(async () => {
  await EagleEyeService.search()
})
</script>
